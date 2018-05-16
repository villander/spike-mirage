import DS from 'ember-data';

export default DS.Model.extend({
  cardNumber: DS.attr('string'),
  cardBrand: DS.attr('string'),
  transactionEvents: DS.hasMany('transaction-event', {async: true, inverse: null})
});
