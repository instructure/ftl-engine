export default {
  create(args, state) {
    return {
      handler: 'bar',
      parameters: {}
    }
  },
  dependsOn: ['foo']
}
