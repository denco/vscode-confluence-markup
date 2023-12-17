'use strict';

import * as path from 'path';
import * as fs from 'fs';
import * as plist from 'plist';
import * as yaml from 'yaml';

const rootDir = path.join(__dirname, '../..');

function convertSyntax(sourceYamlFile: string, targetXmlFile: string) {
	const yamlSyntax = fs.readFileSync(sourceYamlFile, 'utf-8');
	const xmlSyntax = plist.build(yaml.parse(yamlSyntax));

	fs.writeFile(targetXmlFile, xmlSyntax, { encoding: 'utf-8' }, err => {
		if (err) {
			console.error(`Error: ${err}`);
		} else {
			console.info(`Success: syntax converted - ${path.relative(rootDir, targetXmlFile)}`);
		}
	});
}

// "userdefined" starts with 2
if (process.argv[2] && process.argv[2].endsWith('.yml') && fs.existsSync(path.join(rootDir, process.argv[2]))) {
	const yamlFile = path.join(rootDir, process.argv[2]);
	const xmlFile = yamlFile.replace('.yml', '');

	convertSyntax(yamlFile, xmlFile);

	if (process.argv[3] === '--watch') {
		console.info('Start: watching - '.concat(path.relative(rootDir, yamlFile)));

		fs.watchFile(
			yamlFile,
			// The options parameter is used to
			//modify the behaviour of the method
			{
				// Specify the use of big integers
				// in the Stats object
				bigint: false,
				// Specify if the process should
				// continue as long as file is
				// watched
				persistent: true,
				// Specify the interval between
				// each poll the file
				interval: 4000,
			},
			(curr, prev) => {
				return convertSyntax(yamlFile, xmlFile);
			},
		);
	}
} else {
	console.error('File is not provided, not yml or not exists!');
}

// const xmlFile = `${rootDir}/syntaxes/confluence-markup.tmLanguage`;
// const yamlFile = `${xmlFile}.yml`;

// convertSyntax(yamlFile, xmlFile);

// console.log(`Watch file: ${yamlFile}`);
// fs.watchFile(yamlFile,
// 	// The options parameter is used to
// 	//modify the behaviour of the method
// 	{
// 		// Specify the use of big integers
// 		// in the Stats object
// 		bigint: false,
// 		// Specify if the process should
// 		// continue as long as file is
// 		// watched
// 		persistent: true,
// 		// Specify the interval between
// 		// each poll the file
// 		interval: 4000,
// 	}, (curr, prev) => {
// 		console.log("\nThe file was edited");
// 		return convertSyntax(yamlFile, xmlFile);
// 	}
// );
