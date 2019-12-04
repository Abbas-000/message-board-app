/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  var thdId;
  var repId;
  suite('API ROUTING FOR /api/threads/:board', function() {

    suite('POST', function() {
      test('create a thread', function(done) {
        chai.request(server)
          .post('/api/threads/test')
          .send({
            board: 'test',
            text: 'posting a new thread board',
            delete_password: 'correct'
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
          })
          done();
      })
    });

    suite('GET', function() {
      test('Get an array of 10 bumped threads with 3 recent replies not included delete_password and reported field', function(done) {
        chai.request(server)
          .get('/api/threads/test')
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.isBelow(res.body.length, 11);
            assert.isArray(res.body[0].replies);
            assert.isBelow(res.body[0].replies.length, 4);
            assert.property(res.body[0], '_id');
            assert.property(res.body[0], 'text');
            assert.property(res.body[0], 'created_on');
            assert.property(res.body[0], 'bumped_on');
            assert.notProperty(res.body[0], 'delete_password');
            assert.notProperty(res.body[0], 'reported');
            thdId = res.body[0]._id;
          })
          done();
      })
    });

    suite('DELETE', function() {
      test("Delete a thread completely, response text will be 'success' or 'incorrect password'", function(done) {
        chai.request(server)
          .delete('/api/threads/test')
          .send({
            board: 'test',
            thread_id: thdId,
            delete_password: 'wrong'
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'incorrect password');
          })
          done();
      })
    });

    suite('PUT', function() {
      test("update a thread by reporting, response text will be 'success'", function(done) {
        chai.request(server)
          .put('/api/threads/test')
          .send({
            board: 'test',
            thread_id: thdId
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
          })
          done();
      })
    });


  });

  suite('API ROUTING FOR /api/replies/:board', function() {

    suite('POST', function() {
      test('Create a reply to specific thread, that should update thread\'s bumped_on', function(done) {
        chai.request(server)
          .post('/api/replies/test')
          .send({
            board: 'test',
            thread_id: thdId,
            text: 'this is a chai test reply',
            delete_password: 'replypass'
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
          })
          done();
      })
    });

    suite('GET', function() {
      test('Get a thread with all of it\'s replies hiding reported and delete_password fields', function(done) {
        chai.request(server)
          .get('/api/replies/test')
          .query({
            thread_id: thdId
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isObject(res.body);
            assert.isArray(res.body.replies);
            assert.notProperty(res.body.delete_password);
            assert.notProperty(res.body.reported);
            assert.notProperty(res.body.replies.delete_password);
            assert.notProperty(res.body.replies.reported);
            repId = res.body.replies._id;
          })
          done();
      })
    });

    suite('PUT', function() {
      test("update a reply by reporting, response text will be 'success'", function(done) {
        chai.request(server)
          .put('/api/replies/test')
          .send({
            board: 'test',
            thread_id: thdId,
            reply_id: repId
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
          })
          done();
      })
    });

    suite('DELETE', function() {
      test('Delete a reply (just changing the text of reply to ["deleted"]), response will be "success" or "incorrect password"', function(done) {
        chai.request(server)
          .delete('/api/replies/test')
          .send({
            board: 'test',
            thread_id: thdId,
            reply_id: repId,
            delete_password: 'replyfail'
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'incorrect password');
          })
          done();
      })
    });

  });

});
