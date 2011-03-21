Backbone Dirty
--------------
Server-side overrides for Backbone to use `node-dirty` for Model persistence.

### Compatibility

Backbone 0.3.3.

### Usage

Pass a filepath to the db (will be created if it doesn't exist yet) when
calling `require()`.

    var Backbone = require('backbone');
    Backbone.sync = require('backbone-dirty')('app.db').sync;

    // Backbone.sync will now load and save models from app.db.

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

