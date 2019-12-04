/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var CONNECTION_STRING = process.env.DB;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var assert = require('assert');


module.exports = function (app) {

  app.route('/api/threads/:board')
    .post((req, res) => {
      const board = req.params.board;
      const {text, delete_password } = req.body;
      const thread = {
        text,
        delete_password,
        created_on: new Date(),
        bumped_on: new Date(),
        reported: false,
        replies: [],
        replycount: 0
      };
      MongoClient.connect(CONNECTION_STRING, { useUnifiedTopology: true }, (err, client) => {
        assert.equal(null, err);
        var threadCol = client.db('forum').collection(board);
        threadCol.insertOne(thread, (err, doc) => {
          assert.equal(null, err);
          res.redirect(`/b/${board}/`);
        })
        client.close();
      })
    })
    .get((req, res) => {
      const board = req.params.board;
      MongoClient.connect(CONNECTION_STRING, { useUnifiedTopology: true }, (err, client) => {
        assert.equal(null, err);
        var threadCol = client.db('forum').collection(board);
        threadCol.find({}).sort({bumped_on: -1}).limit(10).project({delete_password: 0, reported: 0}).toArray((err, result) => {
          assert.equal(null, err);
          for (var i = 0; i < result.length; i++) {
            result[i].replies = result[i].replies.reverse().slice(0, 3);
            if (result[i].replies.length !== 0) { 
              for (var j = 0; j < result[i].replies.length; j++) {
                delete result[i].replies[j].delete_password; 
                delete result[i].replies[j].reported;
              }
            }
          }
          res.send(result);
        });
        client.close();
      })
    })
    .put((req, res) => {
      const board = req.params.board;
      const { thread_id } = req.body;
      MongoClient.connect(CONNECTION_STRING, { useUnifiedTopology: true }, (err, client) => {
        assert.equal(null, err);
        var threadCol = client.db('forum').collection(board);
        threadCol.findOneAndUpdate({_id: new ObjectId(thread_id)}, {$set: { reported: true }}, (err, result) => {
          assert.equal(null, err);
          if (result.value !== null) {
            res.send('success');
          }
        })
        client.close();
      })
    })
    .delete((req, res) => {
      const board = req.params.board;
      var { thread_id, delete_password } = req.body;
      MongoClient.connect(CONNECTION_STRING, { useUnifiedTopology: true }, (err, client) => {
        assert.equal(null, err);
        var threadCol = client.db('forum').collection(board);
        threadCol.deleteOne({_id: new ObjectId(thread_id), delete_password: delete_password}, (err, doc) => {
          assert.equal(null, err);
          if (doc.result.n === 0) {
            res.send('incorrect password');
          } else {
            res.send('success');
          }
        })
        client.close();
      });
    });
  app.route('/api/replies/:board')
    .post((req, res) => {
      const board = req.params.board;
      const { thread_id, text, delete_password } = req.body;
      const reply = {
        _id: new ObjectId(),
        text,
        delete_password,
        created_on: new Date(),
        reported: false
      };
      MongoClient.connect(CONNECTION_STRING, { useUnifiedTopology: true }, (err, client) => {
        assert.equal(null, err);
        var threadCol = client.db('forum').collection(board);
        threadCol.findOneAndUpdate({_id: new ObjectId(thread_id)}, {$set: {bumped_on: reply.created_on }, $push: {replies: reply}, $inc: {replycount: 1} }, { returnOriginal: false }, (err, result) => {
          assert.equal(null, err);
          res.redirect(`/b/${board}/${thread_id}`);
        });
        client.close();
      })
    })
    .get((req, res) => {
      const board = req.params.board;
      var id = new ObjectId(req.query.thread_id);
      MongoClient.connect(CONNECTION_STRING, { useUnifiedTopology: true }, (err, client) => {
        assert.equal(null, err);
        var threadCol = client.db('forum').collection(board);
        threadCol.find({_id: id}).project({'delete_password': 0, 'reported': 0}).next((err, result) => {
          assert.equal(null, err);
          var doc = result;
          doc.replies.forEach(field => {
            delete field.delete_password;
            delete field.reported;
          });
          res.send(doc);
        });
        client.close();
      })
    })
    .put((req, res) => {
      const board = req.params.board;
      const { thread_id, reply_id } = req.body;
      MongoClient.connect(CONNECTION_STRING, { useUnifiedTopology: true }, (err, client) => {
        assert.equal(null, err);
        var threadCol = client.db('forum').collection(board);
        threadCol.findOneAndUpdate({_id: new ObjectId(thread_id), replies: {$elemMatch: {_id: new ObjectId(reply_id)}}}, {$set: { 'replies.$.reported': true }}, (err, result) => {
          assert.equal(null, err);
          if (result.value !== null) {
            res.send('success');
          }
        })
        client.close();
      })
    })
    .delete((req, res) => {
      const board = req.params.board;
      const { thread_id, reply_id, delete_password } = req.body;
      MongoClient.connect(CONNECTION_STRING, { useUnifiedTopology: true }, (err, client) => {
        assert.equal(null, err);
        var threadCol = client.db('forum').collection(board);
        threadCol.findOneAndUpdate({_id: new ObjectId(thread_id), replies: { $elemMatch: {_id: new ObjectId(reply_id), delete_password: delete_password}}}, {$set: {'replies.$.text': '[deleted]'}}, { returnOriginal: false }, (err, result) => {
          assert.equal(null, err);
          if (result.value === null) {
            res.send('incorrect password');
          } else {
            res.send('success');
          }
        })
        client.close();
      })
    });
};
