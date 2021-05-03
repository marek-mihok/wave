const examples = require('./examples')
const showcase = require('./showcase')

module.exports = {
  someSidebar: {
    'Prologue': [
      'change-log',
      'migrating-0-8',
      'migrating-0',
      'contributing',
    ],
    'Getting Started': [
      'getting-started',
      'installation',
      'tour',
      'tutorial-hello',
      'tutorial-beer',
      'tutorial-monitor',
      'tutorial-counter',
      'tutorial-todo',
    ],
    'Guide': [
      'guide',
      'architecture',
      'scripts',
      'apps',
      'pages',
      'layout',
      'cards',
      'buffers',
      'components',
      'arguments',
      'state',
      'routing',
      'realtime',
      'background',
      'expressions',
      'files',
      'plotting',
      'javascript',
      'graphics',
      'security',
      'logging',
      'cli',
      'development',
      'browser-testing',
      'configuration',
      'deployment',
      'backup',
      'wave-ml',
      'wavedb',
    ],
    'Examples': examples.map(e => `examples/${e.slug}`),
    'Showcase': showcase,
    'API': [
      'api/index',
      'api/core',
      'api/ui',
      'api/ui_ext',
      'api/server',
      'api/graphics',
      'api/types',
      'api/test',
      'api/h2o_wave_ml/index',
      'api/h2o_wave_ml/ml',
      'api/h2o_wave_ml/types',
      'api/h2o_wave_ml/utils',
    ],
  },
};
