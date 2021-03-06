/* global describe, it, beforeEach */

var chai, assert, sinon, spy, TreeModel;
chai = require('chai');
sinon = require('sinon');
spy = sinon.spy;
TreeModel = require('../src/TreeModel');
assert = chai.assert;
chai.Assertion.includeStack = true;

describe('TreeModel', function () {
  'use strict';

  function idEq(id) {
    return function (node) {
      return node.model.id === id;
    };
  }

  describe('with default configuration', function () {
    var treeModel;

    beforeEach(function () {
      treeModel = new TreeModel();
    });

    describe('parse()', function () {
      it('should throw an error when model is a number (not an object)', function () {
        assert.throws(treeModel.parse.bind(treeModel, 1), TypeError, 'Model must be of type object.');
      });

      it('should throw an error when model is a string (not an object)', function () {
        assert.throws(treeModel.parse.bind(treeModel, 'string'), TypeError, 'Model must be of type object.');
      });

      it('should throw an error when some child in the model is not an object', function () {
        assert.throws(
          treeModel.parse.bind(treeModel, {children: ['string']}),
          TypeError,
          'Model must be of type object.');
      });

      it('should create a root node when given a model without children', function () {
        var root;

        root = treeModel.parse({id: 1});

        assert.isUndefined(root.parent);
        assert.isArray(root.children);
        assert.lengthOf(root.children, 0);
        assert.deepEqual(root.model, {id: 1});
      });

      it('should create a root and the respective children when given a model with children', function () {
        var root, node12;

        root = treeModel.parse({
          id: 1,
          children: [
            {
              id: 11,
              children: [{id: 111}]
            },
            {
              id: 12,
              children: [{id: 121}, {id: 122}]
            }
          ]
        });

        assert.isUndefined(root.parent);
        assert.isArray(root.children);
        assert.lengthOf(root.children, 2);
        assert.deepEqual(root.model, {
          id: 1,
          children: [
            {
              id: 11,
              children: [{id: 111}]
            },
            {
              id: 12,
              children: [{id: 121}, {id: 122}]
            }
          ]
        });

        assert.deepEqual(root, root.children[0].parent);
        assert.deepEqual(root, root.children[1].parent);

        node12 = root.children[1];
        assert.isArray(node12.children);
        assert.lengthOf(node12.children, 2);
        assert.deepEqual(node12.model, {
          id: 12,
          children: [{id: 121}, {id: 122}]
        });

        assert.deepEqual(node12, node12.children[0].parent);
        assert.deepEqual(node12, node12.children[1].parent);
      });
    });

    describe('addChild()', function () {
      var root;

      beforeEach(function () {
        root = treeModel.parse({id: 1, children: [{id: 11}, {id: 12}]});
      });

      it('should add child to the end', function () {
        root.addChild(treeModel.parse({id: 13}));
        root.addChild(treeModel.parse({id: 10}));
        assert.deepEqual(root.model.children, [{id: 11}, {id: 12}, {id: 13}, {id: 10}]);
      });
    });

    describe('getPath()', function () {
      var root;

      beforeEach(function () {
        root = treeModel.parse({
          id: 1,
          children: [
            {
              id: 11,
              children: [{id: 111}]
            },
            {
              id: 12,
              children: [{id: 121}, {id: 122}]
            }
          ]
        });
      });

      it('should get an array with the root node if called on the root node', function () {
        var pathToRoot;
        pathToRoot = root.getPath();
        assert.lengthOf(pathToRoot, 1);
        assert.strictEqual(pathToRoot[0].model.id, 1);
      });

      it('should get an array of nodes from the root to the node (included)', function () {
        var pathToNode121;
        pathToNode121 = root.first(idEq(121)).getPath();
        assert.lengthOf(pathToNode121, 3);
        assert.strictEqual(pathToNode121[0].model.id, 1);
        assert.strictEqual(pathToNode121[1].model.id, 12);
        assert.strictEqual(pathToNode121[2].model.id, 121);
      });
    });

    describe('traversal', function () {
      var root, spy121, spy12;

      function callback121(node) {
        if (node.model.id === 121) {
          return false;
        }
      }

      function callback12(node) {
        if (node.model.id === 12) {
          return false;
        }
      }

      beforeEach(function () {
        root = treeModel.parse({
          id: 1,
          children: [
            {
              id: 11,
              children: [{id: 111}]
            },
            {
              id: 12,
              children: [{id: 121}, {id: 122}]
            }
          ]
        });

        spy121 = sinon.spy(callback121);
        spy12 = sinon.spy(callback12);
      });

      describe('walk depthFirstPreOrder by default', function () {
        it('should traverse the nodes until the callback returns false', function () {
          root.walk(spy121, this);
          assert.strictEqual(spy121.callCount, 5);
          assert(spy121.alwaysCalledOn(this));
          assert(spy121.getCall(0).calledWithExactly(root.first(idEq(1))));
          assert(spy121.getCall(1).calledWithExactly(root.first(idEq(11))));
          assert(spy121.getCall(2).calledWithExactly(root.first(idEq(111))));
          assert(spy121.getCall(3).calledWithExactly(root.first(idEq(12))));
          assert(spy121.getCall(4).calledWithExactly(root.first(idEq(121))));
        });
      });

      describe('walk depthFirstPostOrder', function () {
        it('should traverse the nodes until the callback returns false', function () {
          root.walk({strategy: 'post'}, spy121, this);
          assert.strictEqual(spy121.callCount, 3);
          assert(spy121.alwaysCalledOn(this));
          assert(spy121.getCall(0).calledWithExactly(root.first(idEq(111))));
          assert(spy121.getCall(1).calledWithExactly(root.first(idEq(11))));
          assert(spy121.getCall(2).calledWithExactly(root.first(idEq(121))));
        });
      });

      describe('walk depthFirstPostOrder (2)', function () {
        it('should traverse the nodes until the callback returns false', function () {
          root.walk({strategy: 'post'}, spy12, this);
          assert.strictEqual(spy12.callCount, 5);
          assert(spy12.alwaysCalledOn(this));
          assert(spy12.getCall(0).calledWithExactly(root.first(idEq(111))));
          assert(spy12.getCall(1).calledWithExactly(root.first(idEq(11))));
          assert(spy12.getCall(2).calledWithExactly(root.first(idEq(121))));
          assert(spy12.getCall(3).calledWithExactly(root.first(idEq(122))));
          assert(spy12.getCall(4).calledWithExactly(root.first(idEq(12))));
        });
      });

      describe('walk breadthFirst', function () {
        it('should traverse the nodes until the callback returns false', function () {
          root.walk({strategy: 'breadth'}, spy121, this);
          assert.strictEqual(spy121.callCount, 5);
          assert(spy121.alwaysCalledOn(this));
          assert(spy121.getCall(0).calledWithExactly(root.first(idEq(1))));
          assert(spy121.getCall(1).calledWithExactly(root.first(idEq(11))));
          assert(spy121.getCall(2).calledWithExactly(root.first(idEq(12))));
          assert(spy121.getCall(3).calledWithExactly(root.first(idEq(111))));
          assert(spy121.getCall(4).calledWithExactly(root.first(idEq(121))));
        });
      });

      describe('walk using unknown strategy', function () {
        it('should throw an error warning about the strategy', function () {
          assert.throws(
            root.walk.bind(root, {strategy: 'unknownStrategy'}, callback121, this),
            Error,
            'Unknown tree walk strategy. Valid strategies are \'pre\' [default], \'post\' and \'breadth\'.');
        });
      });
    });

    describe('all()', function () {
      var root;

      beforeEach(function () {
        root = treeModel.parse({
          id: 1,
          children: [
            {
              id: 11,
              children: [{id: 111}]
            },
            {
              id: 12,
              children: [{id: 121}, {id: 122}]
            }
          ]
        });
      });

      it('should get an empty array if no nodes match the predicate', function () {
        var idLt0;
        idLt0 = root.all(function (node) {
          return node.model.id < 0;
        });
        assert.lengthOf(idLt0, 0);
      });

      it('should get an array with the node itself if only the node matches the predicate', function () {
        var idEq1;
        idEq1 = root.all(idEq(1));
        assert.lengthOf(idEq1, 1);
        assert.deepEqual(idEq1[0], root);
      });

      it('should get an array with all nodes that match a given predicate', function () {
        var idGt100;
        idGt100 = root.all(function (node) {
          return node.model.id > 100;
        });
        assert.lengthOf(idGt100, 3);
        assert.strictEqual(idGt100[0].model.id, 111);
        assert.strictEqual(idGt100[1].model.id, 121);
        assert.strictEqual(idGt100[2].model.id, 122);
      });

      it('should get an array with all nodes that match a given predicate (2)', function () {
        var idGt10AndChildOfRoot;
        idGt10AndChildOfRoot = root.all(function (node) {
          return node.model.id > 10 && node.parent === root;
        });
        assert.lengthOf(idGt10AndChildOfRoot, 2);
        assert.strictEqual(idGt10AndChildOfRoot[0].model.id, 11);
        assert.strictEqual(idGt10AndChildOfRoot[1].model.id, 12);
      });
    });

    describe('drop()', function () {
      var root;

      beforeEach(function () {
        root = treeModel.parse({
          id: 1,
          children: [
            {
              id: 11,
              children: [{id: 111}]
            },
            {
              id: 12,
              children: [{id: 121}, {id: 122}]
            }
          ]
        });
      });

      it('should give back the dropped node, even if it is the root', function () {
        assert.deepEqual(root.drop(), root);
      });

      it('should give back the dropped node, which no longer be found in the original root', function () {
        assert.deepEqual(root.first(idEq(11)).drop().model, {id: 11, children: [{id: 111}]});
        assert.isUndefined(root.first(idEq(11)));
      });
    });
  });

  describe('with custom children and comparator', function () {
    var treeModel;

    beforeEach(function () {
      treeModel = new TreeModel({
        childrenPropertyName: 'deps',
        modelComparatorFn: function (a, b) {
          return b.id - a.id;
        }
      });
    });

    describe('parse()', function () {
      it('should create a root and sort the respective children according to the comparator', function () {
        var root, node12;

        root = treeModel.parse({
          id: 1,
          deps: [
            {
              id: 11,
              deps: [{id: 111}]
            },
            {
              id: 12,
              deps: [{id: 121}, {id: 122}]
            }
          ]
        });

        assert.isUndefined(root.parent);
        assert.isArray(root.children);
        assert.lengthOf(root.children, 2);
        assert.deepEqual(root.model, {
          id: 1,
          deps: [
            {
              id: 12,
              deps: [{id: 122}, {id: 121}]
            },
            {
              id: 11,
              deps: [{id: 111}]
            }
          ]
        });

        assert.deepEqual(root, root.children[0].parent);
        assert.deepEqual(root, root.children[1].parent);

        node12 = root.children[0];
        assert.isArray(node12.children);
        assert.lengthOf(node12.children, 2);
        assert.deepEqual(node12.model, {
          id: 12,
          deps: [{id: 122}, {id: 121}]
        });

        assert.deepEqual(node12, node12.children[0].parent);
        assert.deepEqual(node12, node12.children[1].parent);
      });
    });

    describe('addChild()', function () {
      var root;

      beforeEach(function () {
        root = treeModel.parse({id: 1, deps: [{id: 12}, {id: 11}]});
      });

      it('should add child respecting the given comparator', function () {
        root.addChild(treeModel.parse({id: 13}));
        root.addChild(treeModel.parse({id: 10}));
        assert.lengthOf(root.children, 4);
        assert.deepEqual(root.model.deps, [{id: 13}, {id: 12}, {id: 11}, {id: 10}]);
      });
    });
  });
});
