
const { v4: uuidv4 } = require('uuid');
const { sql } = require('slonik');
const dao = require('./order_dao');

class DBConnector {
	constructor () {
		this.dao = dao;
	}

	async insertItemOnExample(item){
		const _sql = sql`
			INSERT INTO example (id, time, val)
			VALUES (${item.id}, ${item.time}, ${item.val})
			ON CONFLICT (id) DO NOTHING;
		`;

		await this.dao.queryWithTransaction([_sql]);
	}

  async getItemByID(id){
    const _sql = sql`
      SELECT *
      FROM example
      WHERE
        id = ${id}
    `;

    const result = await this.dao.getQueryResult(_sql);

    return result.rows[0] || null;
  }

	async getItemByIDTree(id){
    const _sql = sql`
      SELECT *
      FROM example_tree
      WHERE
        id = ${id}
    `;

    const result = await this.dao.getQueryResult(_sql);

    return result.rows[0] || null;
  }

  async getRootNode(){
		const rootNode = await this.getItemByIDTree('root');

    return rootNode;
  }

  async upsertNode(item){
    const _sql = [sql`
      INSERT INTO example_tree (
        id, right_id, left_id, is_full,
        start_time, end_time, 
        val)
      VALUES (
        ${item.id}, ${item.right_id || null}, ${item.left_id || null}, ${item.is_full || false},
        ${item.start_time || null}, ${item.end_time || null}, 
        ${(item.val == undefined? null : item.val)})
      ON CONFLICT (id) DO
      UPDATE SET
        right_id = ${item.right_id || null},
        left_id = ${item.left_id || null},
        is_full = ${item.is_full || false},
        start_time = ${item.start_time || null},
        end_time = ${item.end_time || null},
        val = ${(item.val == undefined? null : item.val)}
    `];

    await this.dao.queryWithTransaction(_sql);
  }

	async deleteNode(id){
		const _sql = [sql`
			DELETE FROM example_tree WHERE id = ${id}
		`];

		await this.dao.queryWithTransaction(_sql);
	}

  async getTreeHeight(root){
    let current = root;
    let height = 0;

    while(current.left_id){
      current = await this.getItemByIDTree(current.left_id);
      height ++;
    }

    return height;
  }

	async getSumOfExample(start_time, end_time){
		const _sql = sql`
			SELECT SUM(val) FROM example WHERE time >= ${start_time} AND time < ${end_time};
		`;

		const result = await this.dao.getQueryResult(_sql);

		return result.rows[0];
	}
}

module.exports = new DBConnector();