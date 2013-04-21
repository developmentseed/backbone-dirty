// Write the DB fixture.
var fs = require('fs'),
    db = '{"key":"/api/Fruits/apple","val":{"id":"apple","name":"McIntosh Apple"}}\n'
        + '{"key":"/api/Fruits/melon","val":{"id":"melon","name":"Cantaloupe"}}\n'
        + '{"key":"/api/Veggies/broccoli","val":{"id":"broccoli","name":"Broccoli"}}\n';
fs.writeFileSync(__dirname + '/test.db', db);

var _ = require('underscore'),
    assert = require('assert'),
    sync = require('../backbone-dirty')(__dirname + '/test.db').sync;

// Prop up skeletal Backbone models -- only the methods we need.
var Model  = {
    toJSON: function() { return this; }
};

var APPLE  = _({
    id: 'apple',
    url: function() {
        return '/api/Fruits/apple';
    }
}).extend(Model);

var BROCCOLI = _({
    id: 'broccoli',
    url: function() {
        return '/api/Veggies/broccoli';
    }
}).extend(Model);

var BANANA = _({
    id: 'banana',
    name: 'Yellow Banana',
    url: function() {
        return '/api/Fruits/banana';
    }
}).extend(Model);

var MELON = _({
    id: 'melon',
    url: function() {
        return '/api/Fruits/melon';
    }
}).extend(Model);

var ORANGE = _({
    id: 'orange',
    url: function() {
        return '/api/Fruits/orange';
    }
}).extend(Model);

var FRUITS = _({
    url: function() {
        return '/api/Fruits';
    }
}).extend(Model);

// Initial read check.
exports['read'] = function() {
    sync('read', ORANGE, {
        success: function success(resp) {
            assert.ok(false, 'read: `orange` response should be error.');
        },
        error: function error(resp) {
            assert.ok(resp instanceof Error, 'read: `orange` response should be error.');
        }
    });
    sync('read', APPLE, {
        success: function success(resp) {
            assert.equal(resp.name, 'McIntosh Apple', 'read: `apple` successfully.');
        },
        error: function error(resp) {
            assert.ok(resp instanceof Error, 'read: `apple` successfully.');
        }
    });
};

// Read a collection.
exports['collection'] = function() {
    sync('read', FRUITS, {
        success: function success(resp) {
            assert.deepEqual(_(resp).pluck('id'), ['apple', 'melon'], 'read: `fruits` contains only fruits');
        },
        error: function error(resp) {
            assert.ok(false, 'read: `fruits` contains only fruits');
        }
    });
};

// Full crud cycle.
exports['create'] = function(beforeExit) {
    var methods = {
        'create': function() {
            sync('create', BANANA, {
                success: function success(resp) {
                    assert.deepEqual(resp, {}, 'create: `banana` response should be {}.');
                    methods.cRead();
                },
                error: function error(resp) {
                    assert.ok(false, 'create: `banana` response should be {}.');
                }
            });
        },
        'cRead': function() {
            sync('read', BANANA, {
                success: function success(resp) {
                    assert.equal(resp.name, 'Yellow Banana', 'create: `banana` read successfully.');
                    methods.update();
                },
                error: function error(resp) {
                    assert.ok(false, 'create: `banana` read successfully.');
                }
            });
        },
        'update': function() {
            sync('update', _(_(BANANA).clone()).extend({ name: 'Brown Banana' }), {
                success: function success(resp) {
                    assert.deepEqual(resp, {}, 'update: `banana` response should be {}.');
                    methods.uRead();
                },
                error: function error(resp) {
                    assert.ok(false, 'update: `banana` response should be {}.');
                }
            });
        },
        'uRead': function() {
            sync('read', BANANA, {
                success: function success(resp) {
                    assert.equal(resp.name, 'Brown Banana', 'update: `banana` read successfully.');
                    methods.delete();
                },
                error: function error(resp) {
                    assert.ok(false, 'update: `banana` read successfully.');
                }
            });
        },
        'delete': function() {
            sync('delete', BANANA, {
                success: function success(resp) {
                    assert.deepEqual(resp, {}, 'delete: `banana` response should be {}.');
                    methods.dRead();
                },
                error: function error(resp) {
                    assert.ok(false, 'delete: `banana` response should be {}.');
                }
            });
        },
        'dRead': function() {
            sync('reread', BANANA, {
                success: function success(resp) {
                    assert.deepEqual(false, 'reread: `banana` should return error.');
                },
                error: function error(resp) {
                    assert.ok(true, 'reread: `banana` should return error.');
                }
            });
        }
    };
    methods.create();

    // Clean up fixtures db.
    beforeExit(function() {
        fs.unlinkSync(__dirname + '/test.db');
    });
};
