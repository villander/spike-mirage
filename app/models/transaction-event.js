import DS from 'ember-data';

export default DS.Model.extend({
  success: DS.attr('boolean'),
  status: DS.attr('string'),
  eventType: DS.attr('string'),
  transaction: DS.belongsTo('transaction', {async: true, inverse: null})
});
