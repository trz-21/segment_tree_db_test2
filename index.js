
const dbConnector = require('./src/db/dbconnector');
const TreeReader = require('./src/tree/reader');
const TreeWriter = require('./src/tree/writer');
const treeReader = new TreeReader();
const treeWriter = new TreeWriter();
const {StopWatch} = require('stopwatch-node');
const sw = new StopWatch();

const a = async () => {
	const now = new Date();
	now.setMilliseconds(0);
	for(let i = 0; i < 10000000; i ++){
		now.setMilliseconds(now.getMilliseconds() + 50);

		if(Math.floor(Math.random() * 100) > 98){
			now.setSeconds(now.getMinutes() + 1);
			now.setMilliseconds(0);
			continue;
		}
		

		if(Math.floor(Math.random() * 100) > 50){
			continue;
		}

		const item = {
			id: i.toString(),
			val: Math.floor(Math.random() * 10),
			time: now.toISOString()
		};

		const {id, ...treeItem} = item;
		treeItem.start_time = now.toISOString();
		treeItem.end_time = now.toISOString();

		await dbConnector.insertItemOnExample(item);
		await treeWriter.addItem(treeItem);
		
	}
};

(async () => {
	sw.start('range');
	console.log(await dbConnector.getSumOfExample('2022-02-23T08:42:00Z', '2022-02-23T08:42:20Z'));
	sw.stop();
	sw.start('tree');
	console.log(await treeReader.searchRange('2022-02-23T08:42:00ZZ', '2022-02-23T08:42:20Z'));
	sw.stop();
	sw.prettyPrint();
})();