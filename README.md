# bookshelf-consul-pilot
[![Version](https://badge.fury.io/js/bookshelf-consul-pilot.svg)](http://badge.fury.io/js/bookshelf-consul-pilot)
[![Build Status](https://travis-ci.org/paulleduc/bookshelf-consul-pilot.svg?branch=master)](https://travis-ci.org/paulleduc/bookshelf-consul-pilot)
[![Downloads](http://img.shields.io/npm/dm/bookshelf-consul-pilot.svg)](https://www.npmjs.com/package/bookshelf-consul-pilot)

### Installation

Your database connection file might look something like this:

```javascript
const BookshelfConsulPilot = require('bookshelf-consul-pilot');
const knexfile = require('../../knexfile').development;
const path = require('path');

// Argument 1: The knex config that you would use to instantiate Bookshelf
// Argument 2: The Consul database service name to listen for changes in connections on
// Argument 3: The path to your Bookshelf models folder that bookshelf-consul-pilot will read models from
// Argument 4: A function for configuring Bookshelf plugins. This will called every time a new connection is reported
module.exports = new BookshelfConsulPilot(knexfile, 'database', path.join(__dirname, '/../models'), (bookshelf) => {
    bookshelf.plugin('pagination');
    bookshelf.plugin(require('bookshelf-signals')());
});
```

### Usage

## Defining Models

Ensure that your model files are wrapped in a function that accepts bookshelf as an argument:

```javascript
module.exports = (bookshelf) => {
    return bookshelf.Model.extend({
        tableName: 'books',
    });
};
```

## Querying

```javascript
// include the file created in the Installation step
const db = require('database');

// you can fetch the bookshelf and knex instances like so
// db.bookshelf
// db.knex

function getBooks() {
    // when using Bookshelf models, always fetch the model instance like so. The 'book' argument is
    // the filename of your model in the models directory you specified in the Installation step
    db.model('book').fetchPage()
        .then((books) => {
            console.log(books);
        });
}
```

## Registering Events

Anything that must modify the Bookshelf instance or its models must be wrapped in a register. This allows bookshelf-consul-pilot
to completely reset the Bookshelf instance if a new connection were to be reported. An example is events using the bookshelf-signals
plugin:

```javascript
const db = require('database');

db.register((bookshelf) => {

    bookshelf.on('created', db.model('book'), (model) => {
        console.log('created fired!');
    });

    bookshelf.on('updated', db.model('book'), (model) => {
        console.log('updated fired!');
    });

});
```
