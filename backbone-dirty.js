// Overrides Backbone with `Backbone.sync()` overridden for the server-side
// context. Uses `node-dirty` for model persistence. Models are expected to
// have a URL prefixed by their respective collection (e.g. `/{class}/{id}`)
// and Collections retrieve their respective models based on this convention.
var _ = require('underscore')._,
    Backbone = require('backbone'),
    fs = require('fs'),
    path = require('path'),
    dirty,
    fixtures,
    loaded = false;

module.exports = function(filename, fixtureList) {
    dirty = dirty || require('node-dirty')(filename);
    fixtureList = fixtureList || [];
    fixtureList = _.isString(fixtureList) && [fixtureList];

    // Helper function to get a URL from a Model or Collection as a property
    // or as a function.
    var getUrl = function(object) {
        if (object.url instanceof Function) {
            return object.url();
        } else if (typeof object.url === 'string') {
            return object.url;
        }
    };

    // Load all fixtures at initial require time. Blocking.
    var loadFixture = function(fixture) {
        if (_.isString(fixture)) {
            try {
                var stats = fs.statSync(fixture);
                if (stats.isFile()) {
                    loadFixture(JSON.parse(fs.readFileSync(fixture)));
                } else if (stats.isDirectory()) {
                    _.each(fs.readdirSync(fixture), function(file) {
                        loadFixture(path.join(fixture, file));
                    });
                }
            } catch(e) {}
        } else if ('key' in fixture && 'val' in fixture) {
            fixtures[fixture.key] = fixture.val;
        }
    }
    fixtures || ((fixtures = {}) && _.each(fixtureList, loadFixture));

    // Sync implementation for `node-dirty`.
    var sync = function(method, model, success, error) {
        switch (method) {
        case 'read':
            var data,
                base,
                found;
            if (model.id) {
                data = dirty.get(getUrl(model)) || fixtures[getUrl(model)];
                if (data) {
                    success(data);
                } else {
                    error('Model not found.');
                }
            } else {
                data = [];
                found = [];
                base = getUrl(model);
                dirty.forEach(function(key, val) {
                    if (val && key.indexOf(base) === 0 && data.indexOf(val) === -1) {
                        data.push(val);
                        found.push(key);
                    }
                });
                _.each(fixtures, function(val, key) {
                    if (val && key.indexOf(base) === 0 && data.indexOf(val) === -1 && found.indexOf(key) === -1) {
                        data.push(val);
                        found.push(key);
                    }
                });
                success(data);
            }
            break;
        case 'create':
        case 'update':
            if (_.isEqual(dirty.get(getUrl(model)), model.toJSON())) {
                return success({});
            }
            dirty.set(
                getUrl(model),
                model.toJSON(),
                function(err) {
                    return err ? error(err) : success({});
                }
            );
            break;
        case 'delete':
            if (typeof dirty.get(getUrl(model)) === 'undefined') {
                return success({});
            }
            dirty.rm(
                getUrl(model),
                function(err) {
                    return err ? error(err) : success({});
                }
            );
            break;
        }
    };

    // Set a loaded flag to indicate whether `Backbone.sync()` can begin accessing
    // the db immediately or must wait until the `load` event is emitted.
    dirty.on('load', function() { loaded = true });

    // Override Backbone.sync. Defer the sync operation until the database has
    // been fully loaded if necessary.
    Backbone.sync = function(method, model, success, error) {
        if (loaded) {
            sync(method, model, success, error);
        } else {
            dirty.on('load', function() {
                sync(method, model, success, error);
            });
        }
    };

    return dirty;
};

