import { Command } from 'commander';
import { SwitchBaseCommand } from './commands/switch/index.js';
import { KeystoreBaseCommand } from './commands/keystore/index.js';
import { SetBaseCommand } from './commands/set/index.js';
import { EncryptBaseCommand } from './commands/encrypt/index.js';
import { InitBaseCommand } from './commands/init/index.js';
import { ListBaseCommand } from './commands/list/index.js';
import { RmBaseCommand } from './commands/rm/index.js';
import { BlacklistBaseCommand } from './commands/blacklist/index.js';

const program = new Command();

program
  .name('envctrl')
  .description('Encrypted environment file manager built on dotenvx')
  .version('0.1.0')
  .option('-q, --quiet', 'suppress output', false);

new InitBaseCommand().register(program);
new ListBaseCommand().register(program);
new SwitchBaseCommand().register(program);
new KeystoreBaseCommand().register(program);
new SetBaseCommand().register(program);
new EncryptBaseCommand().register(program);
new RmBaseCommand().register(program);
new BlacklistBaseCommand().register(program);

program.parseAsync(process.argv);
