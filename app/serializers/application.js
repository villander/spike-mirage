import DS from 'ember-data';
import { classify, decamelize, camelize, underscore } from '@ember/string';
import { singularize, pluralize } from 'ember-inflector';
import { isNone } from '@ember/utils';

export default DS.RESTSerializer.extend({
  // SERIALIZE

  /**
    Converts camelCased attributes to underscored when serializing.

    @method keyForAttribute
    @param {String} attribute
    @return String
  */
  keyForAttribute(attr) {
    return decamelize(attr);
  },

  /**
    Underscores relationship names and appends "_id" or "_ids" when serializing
    relationship keys.

    @method keyForRelationship
    @param {String} relationshipModelName
    @param {String} kind
    @return String
  */
  keyForRelationship(relationshipModelName, kind) {
    let key = decamelize(relationshipModelName);
    if (kind === 'belongsTo') {
      return key + '_id';
    } else if (kind === 'hasMany') {
      return singularize(key) + '_ids';
    } else {
      return key;
    }
  },

  /**
   `keyForLink` can be used to define a custom key when deserializing link
   properties. The `ActiveModelSerializer` camelizes link keys by default.

   @method keyForLink
   @param {String} key
   @param {String} kind `belongsTo` or `hasMany`
   @return {String} normalized key
  */
  keyForLink(key) {
    return camelize(key);
  },

  /*
    Does not serialize hasMany relationships by default.
  */
  serializeHasMany() { },

  /**
   Underscores the JSON root keys when serializing.

    @method payloadKeyFromModelName
    @param {String} modelName
    @return {String}
  */
  payloadKeyFromModelName(modelName) {
    return underscore(decamelize(modelName));
  },

  /**
    Serializes a polymorphic type as a fully capitalized model name.

    @method serializePolymorphicType
    @param {DS.Snapshot} snapshot
    @param {Object} json
    @param {Object} relationship
  */
  serializePolymorphicType(snapshot, json, relationship) {
    let key = relationship.key;
    let belongsTo = snapshot.belongsTo(key);
    let jsonKey = underscore(key + '_type');

    if (isNone(belongsTo)) {
      json[jsonKey] = null;
    } else {
      json[jsonKey] = classify(belongsTo.modelName).replace('/', '::');
    }
  },

  /**
    Add extra step to `DS.RESTSerializer.normalize` so links are normalized.

    If your payload looks like:

    ```js
    {
      "post": {
        "id": 1,
        "title": "Rails is omakase",
        "links": { "flagged_comments": "api/comments/flagged" }
      }
    }
    ```

    The normalized version would look like this

    ```js
    {
      "post": {
        "id": 1,
        "title": "Rails is omakase",
        "links": { "flaggedComments": "api/comments/flagged" }
      }
    }
    ```

    @method normalize
    @param {subclass of DS.Model} typeClass
    @param {Object} hash
    @param {String} prop
    @return Object
  */
  normalize(typeClass, hash, prop) {
    this.normalizeLinks(hash);
    return this._super(typeClass, hash, prop);
  },

  /**
    Convert `snake_cased` links  to `camelCase`

    @method normalizeLinks
    @param {Object} data
  */

  normalizeLinks(data) {
    if (data.links) {
      let links = data.links;

      for (let link in links) {
        let camelizedLink = camelize(link);

        if (camelizedLink !== link) {
          links[camelizedLink] = links[link];
          delete links[link];
        }
      }
    }
  },

  /**
   * @private
  */
  _keyForIDLessRelationship(key, relationshipType, ) {
    if (relationshipType === 'hasMany') {
      return underscore(pluralize(key));
    } else {
      return underscore(singularize(key));
    }
  },

  extractRelationships(modelClass, resourceHash) {
    modelClass.eachRelationship(function (key, relationshipMeta) {
      let relationshipKey = this.keyForRelationship(key, relationshipMeta.kind, 'deserialize');

      let idLessKey = this._keyForIDLessRelationship(key, relationshipMeta.kind, 'deserialize');

      // converts post to post_id, posts to post_ids
      if (resourceHash[idLessKey] && typeof relationshipMeta[relationshipKey] === 'undefined') {
        resourceHash[relationshipKey] = resourceHash[idLessKey];
      }

      // prefer the format the AMS gem expects, e.g.:
      // relationship: {id: id, type: type}
      if (relationshipMeta.options.polymorphic) {
        extractPolymorphicRelationships(key, relationshipMeta, resourceHash, relationshipKey);
      }
      // If the preferred format is not found, use {relationship_name_id, relationship_name_type}
      if (resourceHash.hasOwnProperty(relationshipKey) && typeof resourceHash[relationshipKey] !== 'object') {
        let polymorphicTypeKey = this.keyForRelationship(key) + '_type';
        if (resourceHash[polymorphicTypeKey] && relationshipMeta.options.polymorphic) {
          let id = resourceHash[relationshipKey];
          let type = resourceHash[polymorphicTypeKey];
          delete resourceHash[polymorphicTypeKey];
          delete resourceHash[relationshipKey];
          resourceHash[relationshipKey] = { id: id, type: type };
        }
      }
    }, this);
    return this._super(...arguments);
  },

  modelNameFromPayloadKey(key) {
    let convertedFromRubyModule = singularize(key.replace('::', '/'));
    return DS.normalizeModelName(convertedFromRubyModule);
  }
});

function extractPolymorphicRelationships(key, relationshipMeta, resourceHash, relationshipKey) {
  let polymorphicKey = decamelize(key);
  let hash = resourceHash[polymorphicKey];
  if (hash !== null && typeof hash === 'object') {
    resourceHash[relationshipKey] = hash;
  }
}
