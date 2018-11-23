# generator-remote

Yeoman generator for scaffolding any sort of project from a git repository.

## Prerequisites

Git must be installed on the system.

## Usage

You can use this generator by installing it globally and executing yeoman by specifying its name:

```
npm i -g  generator-remote
mkdir my-project
yo remote git@github.com:solunio/my-template.git my-project
```

Additionally you are prompted to specify key value pairs, which are then inserted in your template project with the
yeoman template engine.
