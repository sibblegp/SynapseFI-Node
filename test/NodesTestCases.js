'use strict';

var assert = require('chai').assert;
var Users = require('../lib/Users.js');
var Nodes = require('../lib/Nodes.js');
var Helpers = require('./Helpers.js');

const synapseUSpayload = {
  type: 'SYNAPSE-US',
  info: {
    nickname: 'SYNAPSE-US TEST NODE'
  },
  extra: {
    supp_id: '1234'
  }
};

const bankLoginNoMfa = {
  type: "ACH-US",
  info:{
    bank_id: "synapse_nomfa",
    bank_pw: "test1234",
    bank_name: "fake"
  }
};

const bankLoginWithMfa = {
  type: 'ACH-US',
  info: {
    bank_id: 'synapse_good',
    bank_pw: 'test1234',
    bank_name: 'fake'
  }
};

const acctRoutingPayload = {
  type: 'ACH-US',
  info: {
    nickname: 'Node Library Checking Account',
    name_on_account: 'Node Library',
    account_num: String(Math.floor(Math.random() * 1000000000)),
    routing_num: '051000017',
    type: 'PERSONAL',
    class: 'CHECKING'
  },
  extra: {
    supp_id: '1234'
  }
};

var nodeUser;

describe('Nodes', function() {
  this.timeout(30000);

  beforeEach(function(done) {
    Users.get(
      Helpers.client,
      {
        ip_address: Helpers.ip_address,
        fingerprint: Helpers.fingerprint,
        _id: Helpers.user_id
      },
      function(err, user) {
        nodeUser = user;
        done();
      });
  });

  describe('create SYNAPSE-US', function() {
    it('should create a Node object array', function(done) {
      Nodes.create(
        nodeUser,
        synapseUSpayload,
        function(err, nodes) {
          assert.isNull(err, 'there was no error');
          assert(nodes[0].user !== undefined);
          done();
        }
      );
    });
  });

  describe('create ACH-US via bank login', function() {
    it('should create a Node object array', function(done) {
      Nodes.create(
        nodeUser,
        bankLoginNoMfa,
        function(err, nodes) {
          assert(nodes.length !== 0);
          done();
        }
      );
    });
  });

  describe('create ACH-US via bank login with MFA', function() {
    it('should create a Node object array', function(done) {
      Nodes.create(
        nodeUser,
        bankLoginWithMfa,
        function(err, nodes) {
          assert.isNotNull(nodes)
          assert.isNotNull(nodes.body.mfa);

          var mfa = nodes.body.mfa;
          var mfaPayload = {
            access_token: mfa.access_token,
            mfa_answer: 'test_answer'
          };

          // verify mfa
          Nodes.create(
            nodeUser,
            mfaPayload,
            function(err, nodes) {
              var node = nodes[0];
              assert.isNull(err, 'there was no error');
              assert(node.user !== undefined);
              done();
            }
          );
        }
      );
    });
  });

  describe('create ACH-US via account/routing', function() {
    var node;
    it('should create a Node object that has CREDIT permission', function(done) {
      Nodes.create(
        nodeUser,
        acctRoutingPayload,
        function(err, nodes) {
          node = nodes[0];
          // does not have DEBIT permission
          assert(node.json.allowed === 'CREDIT');
          done();
        }
      );
    });

    it('should resend micro deposits', function(done) {
      node.resendMicro(
        function(err, updatedNode) {
          assert.isNull(err, 'there was no error');
          done();
        }
      );
    });

    it('should update permission to CREDIT-AND-DEBIT after verification', function(done) {
      var microPayload = {
        micro: [0.1, 0.1]
      };

      node.update(
        microPayload,
        function(err, updatedNode) {
          assert.isNull(err, 'there was no error');
          assert(updatedNode.allowed === 'CREDIT-AND-DEBIT');
          done();
        }
      );
    });
  });

  describe('get nodes', function() {
    it('should get multiple nodes in a JSON format', function(done) {
      Nodes.get(
        nodeUser,
        null,
        function(err, json) {
          assert.isNull(err, 'Error should be null');
          assert(json['nodes'].length > 0);
          done();
        }
      );
    });
  });

  describe('get with node _id', function() {
    it('should get a single Node object', function(done) {
      Nodes.get(
        nodeUser,
        {
          _id: Helpers.node_id
        },
        function(err, node) {
          assert.isNull(err);
          assert(node.user !== undefined);
          done();
        }
      );
    });
  });

  describe('get with full_dehydrate', function() {
    it('should get a single Node object with full dehydrate', function(done) {
      Nodes.get(
        nodeUser,
        {
          _id: Helpers.node_id,
          full_dehydrate: 'yes'
        },
        function(err, node) {
          assert.isNull(err);
          assert(node.user !== undefined);
          done();
        }
      );
    });
  });

  describe('get with full_dehydrate and force_refresh', function() {
    it('should get a single Node object with full dehydrate and force_refresh', function(done) {
      Nodes.get(
        nodeUser,
        {
          _id: Helpers.node_id,
          full_dehydrate: 'yes',
          force_refresh: 'yes'
        },
        function(err, node) {
          assert.isNull(err);
          assert(node.user !== undefined);
          done();
        }
      );
    });
  });

  describe('get with force_refresh', function() {
    it('should get a single Node object with full dehydrate and force_refresh', function(done) {
      Nodes.get(
        nodeUser,
        {
          _id: Helpers.node_id,
          full_dehydrate: 'yes',
          force_refresh: 'yes'
        },
        function(err, node) {
          assert.isNull(err);
          assert(node.user !== undefined);
          done();
        }
      );
    });
  });

  describe('get nodes with correct filter params', () => {
    it('should filter nodes by page', done => {
      Nodes.get(
        nodeUser,
        {
          page: 2
        },
        (err, nodes) => {
          assert.equal(nodes.page, 2);
          done();
        }
      )
    });

    it('should filter nodes by limit', done => {
      Nodes.get(
        nodeUser,
        {
          per_page: 16
        },
        (err, nodes) => {
          assert.equal(nodes.limit, 16);
          done();
        }
      )
    });

    it('should filter nodes by type', done => {
      Nodes.get(
        nodeUser,
        {
          type: 'DEPOSIT-US'
        },
        (err, nodes) => {
          assert.equal(nodes.nodes[0].type, 'DEPOSIT-US');
          done();
        }
      )
    });

    it('should filter nodes by all params', done => {
      Nodes.get(
        nodeUser,
        {
          type: 'DEPOSIT-US',
          page: 1,
          per_page: 15
        },
        (err, nodes) => {
          assert.equal(nodes.nodes[0].type, 'DEPOSIT-US');
          assert.equal(nodes.page, 1);
          assert.equal(nodes.limit, 15);
          done();
        }
      )
    });
  });
});
