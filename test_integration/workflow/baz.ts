export default {
  create(args, state) {
    return {
      handler: 'baz',
      parameters: {}
    }
  },
  dependsOn: ['bar']
}
