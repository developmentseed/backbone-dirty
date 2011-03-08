Backbone Dirty
--------------
Server-side overrides for Backbone to use `node-dirty` for Model persistence.

### Compatibility

Backbone 0.3.3.

### Usage

Pass a filepath to the db (will be created if it doesn't exist yet) when
calling `require()`.

    var dirty = require('backbone-dirty')('app.db');
    var Backbone = require('backbone');

    // Backbone.sync will now load and save models from app.db.

### Fixtures

An optional array of fixtures can be passed to load default data to be
retrieved. Loaded fixtures cannot be deleted but may be "overridden" by a
database-saved version of the same model. The fixtures array may contain

1. An object with `key` and `val` attributes
2. A string path to a JSON file containing `1`
3. A string path to a directory containing `2`

    var fixtures = [
        '/path/to/a/file.json',
        '/path/to/many/fixtures',
        {
            key: 'fruits/orange',
            val: {
                id: 'orange',
                flavor: 'delicious'
            }
        }
    ];
    var dirty = require('backbone-dirty')('app.db', fixtures);

### Conventions

`backbone-dirty` stores models in the `node-dirty` db using the `model.url` as
its key. Collections retrieve models by matching the Collection url against
the initial portion of the Model url.

    var orange = new FruitModel({id: 'orange'});
    var apple = new FruitModel({id: 'apple'});
    var banana = new FruitModel({id: 'banana'});

    console.log(orange.url()); // fruits/orange
    console.log(apple.url());  // fruits/apple
    console.log(banana.url()); // fruits/banana

    var fruits = new FruitCollection();

    console.log(fruits.url);   // fruits

    fruits.fetch();            // retrieves orange, apple, banana

### Authors

- [Will White](http://github.com/willwhite)
- [Young Hahn](http://github.com/yhahn)

