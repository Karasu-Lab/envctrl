import type { Command } from "commander";
import { BaseCommand } from "../../base-command.js";
import { KeystoreCreateSubCommand } from "./create.js";
import { KeystoreListSubCommand } from "./list.js";
import { KeystoreDeleteSubCommand } from "./delete.js";

/** Registers the `keystore` command group onto the Commander program. */
export class KeystoreBaseCommand extends BaseCommand {
  /** @inheritdoc */
  register(program: Command): void {
    const keystoreCmd = program
      .command("keystore")
      .description("Manage keystore directories for dotenvx private keys");

    keystoreCmd
      .command("create [path]")
      .description("Create a new keystore (defaults to platform app data folder)")
      .option("-n, --name <name>", "name for the keystore entry in the registry")
      .action(async (keystorePath: string | undefined, opts: { name?: string }) => {
        await this.dispatch(
          new KeystoreCreateSubCommand(),
          { keystorePath, name: opts.name },
          this.buildContext(program)
        );
      });

    keystoreCmd
      .command("list")
      .description("List all registered keystores")
      .action(async () => {
        await this.dispatch(
          new KeystoreListSubCommand(),
          {},
          this.buildContext(program)
        );
      });

    keystoreCmd
      .command("delete <name>")
      .description("Delete a named keystore and remove it from the registry")
      .option("--force", "skip confirmation and delete immediately", false)
      .action(async (name: string, opts: { force: boolean }) => {
        await this.dispatch(
          new KeystoreDeleteSubCommand(),
          { name, force: opts.force },
          this.buildContext(program)
        );
      });
  }
}
