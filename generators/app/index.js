const Generator = require('yeoman-generator');
const inquirer = require('inquirer');
const remove = require('rimraf');
const path = require('path');
const fs = require('fs');
const rxjs = require('rxjs');


module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);

        this.options.repository = '';
        this.options.directory = '';
        this.options.template = '';
        this.options.data = {};

        this.argument('repository', {
            desc: 'The (possibly remote) repository to scaffold from',
            required: true,
            type: String
        });

        this.argument('directory', {
            desc: 'The name of a new directory to scaffold into',
            required: false,
            type: String,
            default: this.destinationPath()
        });
    }

    initializing() {
        if(this._checkIfEmptyDirectory(this.options.directory)) {
            this.env.error('The destination directory is not empty.');
        }

        this.options.template = this._generateRandomString();
    }

    configuring() {
        this.spawnCommandSync('git', ['init'], {cwd: this.options.directory});
    }

    prompting() {
        return new Promise((resolve, reject) => {
            const prompts = new rxjs.BehaviorSubject({
                type: 'confirm',
                name: 'confirm',
                message: 'Would you like to specify key-value pairs'
            });

            // this.prompt does not work with observables so the original inquirer has to be used
            inquirer.prompt(prompts).ui.process.subscribe(
                answer => {
                    const regex = /^(\w*):(\S*)$/g;

                    if(answer.answer) {
                        if(answer.answer !== true) {
                            const matches = regex.exec(answer.answer);

                            this.options.data[matches[1]] = matches[2];
                        }

                        prompts.next({
                            type: 'input',
                            name: 'value',
                            message: 'Key-value pair (Press enter to leave) [<key>:<value>]',
                            validate: value => (regex.test(value) || value === '') ?
                                true :
                                'Wrong format! Input format should be <key>:<value>.'
                        });
                    } else {
                        prompts.complete();
                    }
                },
                error => {
                    reject(error);
                },
                () => {
                    resolve();
                }
            );
        });
    }

    writing() {
        this.spawnCommandSync('git',
            ['clone', this.options.repository, this.templatePath(this.options.template)]);
        this.fs.copyTpl([
                this.templatePath(`${this.options.template}/`),
                `!${this.templatePath(this.options.template)}/.git/`
            ],
            this.options.directory,
            this.options.data,
            {},
            {globOptions: {dot: true}});
    }

    install() {
        const options = {
            npm: false,
            bower: false,
            yarn: false
        };

        if(this.fs.exists(path.join(this.options.directory, 'bower.json'))) {
            options.bower = true;
        }

        if(this.fs.exists(path.join(this.options.directory, 'package.json'))) {
            if(this.fs.exists(path.join(this.options.directory, 'yarn.lock'))) {
                options.yarn = true;
            } else {
                options.npm = true;
            }
        }

        this.installDependencies(options);
    }

    end() {
        remove(this.templatePath(this.options.template), () => {
        });
    }

    _generateRandomString() {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let text = '';

        for(let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return text;
    }

    _checkIfEmptyDirectory(path) {
        return !!fs.readdirSync(path).length;
    }
};
