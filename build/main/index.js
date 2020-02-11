#!/usr/bin/env node
"use strict";
/**
 * This file is utilized at the start of execution of the program
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const clear_1 = __importDefault(require("clear"));
const config_1 = require("./config");
const files_1 = require("./lib/files");
const util = __importStar(require("./lib/util"));
const helper_functions_1 = require("./lib/helper-functions");
const MODULE_NEW = __importStar(require("./modules/new"));
const cli_description_1 = require("./default objects/cli-description");
// Assign CLI object a default value
exports.CLI_DESCRIPTION = cli_description_1.CLI_DEFAULT;
/**
 * Parse commands provided by template manifest files
 * and generate the CLI help menus as well as extract
 * info useful for generating the sub features
 * @param feature - Feature that the user inputed (eg. project, page, component)
 * @param required - Boolean value which tells you if the feature is required or not.
 *                   Required features include 'config' and 'store'
 */
async function populateFeatureMenu(feature, required = false) {
    const index = 2;
    let featureConfig;
    let cliFeature;
    featureConfig = files_1.readSubConfig(feature);
    // [1] Based of the feature that the user inputs, the configuration property is populated
    helper_functions_1.featureConfigurationAssignment(feature, featureConfig);
    // [2] Add feature, under the "Features: " header,
    // to general help text if not required for new project generation
    if (!required) {
        helper_functions_1.contentPopulate(exports.CLI_DESCRIPTION.general.menu, `${chalk_1.default.magenta(feature)}`, `${featureConfig.description}`, index);
    }
    // [3] Assign the configuration for the specified feature
    cliFeature = helper_functions_1.getFeatureMenu(feature);
    // [4] Create menu specific to a feature entered by user
    // The USAGE_TEMPLATE in ./config.ts is used as base.
    cliFeature.menu = config_1.USAGE_TEMPLATE(undefined, undefined, feature, undefined, undefined);
}
/**
 * Description: Adding the necessary information to the Usage object to be used in command execution
 * @param features - acceptable features that can be created with rdvue
 * @param requiredFeatures - features that can't be user requested
 * but are required to create a project (eg. config and store)
 * @param mainConfig - config data populated from template.json.
 * Describes options the tool can take.
 */
async function populateCLIMenu(features, requiredFeatures, mainConfig) {
    const index = 2;
    let featureConfig;
    // [1] Intialize the CLI menu with the USAGE_TEMPLATE (./config.ts)
    exports.CLI_DESCRIPTION.general.menu = config_1.USAGE_TEMPLATE();
    exports.CLI_DESCRIPTION.general.menu.splice(index, 0, {
        header: 'Features:',
        content: [],
    });
    // [3] Add project config to CLI_DESCRIPTION
    if (exports.CLI_DESCRIPTION.general.menu[index].content !== undefined) {
        helper_functions_1.contentPopulate(exports.CLI_DESCRIPTION.general.menu, `${chalk_1.default.magenta('project')}`, 'Generate a new project.', index);
    }
    // [4] Parse features provided by template manifest files and generate the CLI help menus
    // for both required and non required features depending on user input
    for (const feature of features) {
        await populateFeatureMenu(feature);
    }
    for (const feature of requiredFeatures) {
        await populateFeatureMenu(feature, true);
    }
    // [5] Add 'project' to list of features input by user
    features.push('project');
    // [6] Creating 'project' features configuration
    featureConfig = mainConfig;
    featureConfig.name = 'project';
    featureConfig.arguments = [
        {
            'name': 'projectName',
            'type': 'string',
            'description': 'the name for the generated project.'
        },
        {
            'name': 'projectNameKebab',
            'type': 'string',
            'description': 'the name in Kebab-case for the generated project.',
            'isPrivate': true
        }
    ];
    // [7] Setting the project config to the newly created featureConfig
    exports.CLI_DESCRIPTION.project.config = featureConfig;
}
async function run() {
    try {
        // [1a] Assign config to object return from JSON parse
        const mainConfig = files_1.readMainConfig();
        // [1b] Return list of features if true and empty array if false
        const features = (mainConfig.import !== undefined) ? mainConfig.import.optional : [];
        // [1c] Return value if true and empty array if false
        const requiredFeatures = (mainConfig.import !== undefined) ?
            mainConfig.import.required : [];
        const sliceNumber = 2;
        // [1d] Check for user arguments
        const userArgs = process.argv.slice(sliceNumber);
        let project;
        // [2] Clear the console
        clear_1.default();
        // [3] Populate feature usage information
        await populateCLIMenu(features, requiredFeatures, mainConfig);
        // [4] Display "rdvue" heading
        util.heading();
        // [5] Check to see if user arguments include any valid features
        if (util.hasFeature(userArgs, features)) {
            // [6] Puts the user arguments into an object that seperates them into action,
            // feature, option and feature name from format
            // rdvue <action> <feature> <feature name> [options]
            // TODO: TRY CATCH???
            const operation = {
                action: util.parseUserInput(userArgs, features).action,
                feature: `${util.parseUserInput(userArgs, features).feature}`,
                options: util.parseUserInput(userArgs, features).options,
                featureName: util.parseUserInput(userArgs, features).featureName,
            };
            // [6b] Check to see if the project is valid
            project = util.checkProjectValidity(operation);
            if (project.isValid) {
                // [7a] Call the run function in modules/new/index.ts
                await MODULE_NEW.run(operation, exports.CLI_DESCRIPTION);
            }
            else {
                // [7b] Throw an error if this is not a valid project
                throw Error(`'${process.cwd()}' is not a valid Vue project.`);
            }
        }
        else {
            // [6c] Show Help Text if no valid feature/action have been inputted
            // TODO: Throw and error for invalid command
            console.log(util.displayHelp(exports.CLI_DESCRIPTION.general.menu));
        }
        // [6] Force process to exit
        process.exit();
    }
    catch (err) {
        // TODO: Implement more contextual errors
        if (err) {
            console.log(chalk_1.default.red(`${err}`));
        }
        process.exit();
    }
}
run()
    .then(() => {
    console.info('info');
})
    .catch((err) => {
    console.error(`Error at run: ${err}`);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQTs7R0FFRzs7Ozs7Ozs7Ozs7O0FBRUgsa0RBQTBCO0FBQzFCLGtEQUEwQjtBQUMxQixxQ0FBMEM7QUFDMUMsdUNBQTREO0FBQzVELGlEQUFtQztBQUVuQyw2REFBeUc7QUFDekcsMERBQTRDO0FBRTVDLHVFQUFnRTtBQUtoRSxvQ0FBb0M7QUFDekIsUUFBQSxlQUFlLEdBQVEsNkJBQVcsQ0FBQztBQUU5Qzs7Ozs7OztHQU9HO0FBQ0gsS0FBSyxVQUFVLG1CQUFtQixDQUFDLE9BQWUsRUFBRSxRQUFRLEdBQUcsS0FBSztJQUNsRSxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUM7SUFDaEIsSUFBSSxhQUFxQixDQUFDO0lBQzFCLElBQUksVUFBcUMsQ0FBQztJQUMxQyxhQUFhLEdBQUcscUJBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUV2Qyx5RkFBeUY7SUFDekYsaURBQThCLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBRXZELGtEQUFrRDtJQUNsRCxrRUFBa0U7SUFDbEUsSUFBSSxDQUFDLFFBQVEsRUFBRTtRQUNiLGtDQUFlLENBQ2IsdUJBQWUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUM1QixHQUFHLGVBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFDM0IsR0FBRyxhQUFhLENBQUMsV0FBVyxFQUFFLEVBQzlCLEtBQUssQ0FDTixDQUFDO0tBQ0g7SUFFRCx5REFBeUQ7SUFDekQsVUFBVSxHQUFHLGlDQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFckMsd0RBQXdEO0lBQ3hELHFEQUFxRDtJQUNyRCxVQUFVLENBQUMsSUFBSSxHQUFHLHVCQUFjLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBRXhGLENBQUM7QUFF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