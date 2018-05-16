import { Factory } from 'ember-cli-mirage';

export default Factory.extend({
  "card_number": "411111******1111",
  "card_brand": "visa",
  afterCreate(transaction, server) {
    server.create('transaction-event', { transaction });
  }
});