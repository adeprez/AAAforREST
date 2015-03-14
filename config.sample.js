/**
 * Configuration file to be copied as `config.js` and edited to fit your needs.
 * Note: This can be replaced with a JSON file of the same structure
 * (`config.json`) especially when the settings are generated by a program.
 */
module.exports = {

  /**
   * Port number of the reverse proxy.
   */
  //port: 80,

  sites: [{

    /**
     * Exact name or regular expression that matches
     * the host name of the virtual server.
     * If multiple sites match, the first site on the list wins.
     */
    hostProxy: "shop.acme.com",

    /**
     * Hostname of the upstream server.
     */
    //host: "localhost",

    /**
     * Port number of the upstream server.
     */
    //port: 80,

    /**
     * Base path of the upstream server.
     */
    //path: '',

    /**
     * Should HTTP credentials be handled by the upstream server?
     */
    //preserveCredentials: false,

    /**
     * Number of URI segments to remove from the Location header.
     */
    //hideLocationParts: 0,

    authentication: [

      /**
       * LDAP binding settings.
       */
      {url: "ldap://ldap.acme.org", id: "cn", dn: "dc=acme,dc=org"},
      {url: "ldap://ldap.acme.com", id: "uid", dn: "ou=People,dc=acme,dc=com"},

      /**
       * Fixed credentials.
       */
      {login: "roadrunner", password: "bipbip"}
    ],

    restricted: {

      /**
       * Restricted resources patterns and authorized users. 
       */
      "rocket": ["will.coyote"],
      "magnet": ["will.coyote"],
      "false hole": ["will.coyote"],
      "rifle": ["elmer.fudd"],
      "ammo": ["elmer.fudd"]
    },

    /**
     * Rules defining the `action` to be taken
     * when `control` is true.
     * Note: A fallback rule is always on. It is defined as:
     * `control: "true"` and `action: "proxyWork(context)"`.
     */
    rules: [{
      control: function() {
        return this.method != 'GET';
      },
      action: function() {
        var $ = this;
        $.authenticate($.context, function() {
          $.authorize($.context, function() {
            $.proxyWork($.context);
          });
        });
      }
    }]
  }]
};
