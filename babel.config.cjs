module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    // fixed config issue for react testing, Daniel Lai, A0192327A
    ['@babel/preset-react', { runtime: 'automatic' }],
  ]
};
