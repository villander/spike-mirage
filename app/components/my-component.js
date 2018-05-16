import Component from '@ember/component';

export default Component.extend({
  init() {
    this._super(...arguments);
    const transactionId = this.get('transactionEvent').belongsTo('transaction').id();
    this.set('transactionId', transactionId);
  }
});
