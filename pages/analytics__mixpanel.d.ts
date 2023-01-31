// https://github.com/DavidWells/analytics/blob/master/packages/analytics-plugin-mixpanel/src/browser.js
declare module '@analytics/mixpanel' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  type AnalyticsPlugin = import('analytics').AnalyticsPlugin;

  /**
   * Mixpanel Analytics plugin
   * @link https://getanalytics.io/plugins/mixpanel/
   * @param {object} pluginConfig - Plugin settings
   * @param {string} pluginConfig.token - The mixpanel token associated to a mixpanel project
   * @param {object} [pluginConfig.options] - The mixpanel init options https://github.com/mixpanel/mixpanel-js/blob/8b2e1f7b/src/mixpanel-core.js#L87-L110
   * @param {string} [pluginConfig.pageEvent] - Event name to use for page() events (default to page path)
   * @param {string} [pluginConfig.customScriptSrc] - Load mixpanel script from custom source
   * @return {object} Analytics plugin
   * @example
   *
   * mixpanelPlugin({
   *   token: 'abcdef123'
   * })
   */
  function mixpanelPlugin(pluginConfig: { token: string; options?: any; pageEvent?: string; customScriptSrc?: string }): AnalyticsPlugin;

  export default mixpanelPlugin;
}
