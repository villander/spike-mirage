import DS from 'ember-data';
import { pluralize } from 'ember-inflector';
import { decamelize, underscore } from '@ember/string';

const { RESTAdapter } = DS;

export default RESTAdapter.extend({
  /**
    Overrides the `pathForType` method to build
    underscored URLs by decamelizing and pluralizing the object type name.
    ```js
      this.pathForType('superUser');
      //=> 'super_users'
    ```
    @method pathForType
    @param {String} modelName
    @return String
  */
  pathForType(modelName) {
    let decamelized = decamelize(modelName);
    let underscored = underscore(decamelized);
    return pluralize(underscored);
  },

  /**
    The ActiveModelAdapter overrides the `handleResponse` method
    to format errors passed to a DS.InvalidError for all
    422 Unprocessable Entity responses.
    A 422 HTTP response from the server generally implies that the request
    was well formed but the API was unable to process it because the
    content was not semantically correct or meaningful per the API.
    For more information on 422 HTTP Error code see 11.2 WebDAV RFC 4918
    https://tools.ietf.org/html/rfc4918#section-11.2
    @method handleResponse
    @param  {Number} status
    @param  {Object} headers
    @param  {Object} payload
    @return {Object | DS.AdapterError} response
  */
 handleResponse(status, headers, payload) {
  if (this.isInvalid(status, headers, payload)) {
    let errors = DS.errorsHashToArray(payload.errors);

    return new DS.InvalidError(errors);
  } else {
    return this._super(...arguments);
  }
}
});
