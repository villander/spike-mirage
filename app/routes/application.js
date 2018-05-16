import Route from '@ember/routing/route';

export default Route.extend({
  model() {
    return this.get('store').query('transaction-event', {
      per: 15
    });
    // return this.get('store').findAll('transaction');
  }
});
