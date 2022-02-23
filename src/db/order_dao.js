
const { createPool } = require('slonik');
const connectionStr = 'postgres://kimtaeyoon:(rkskekfk)zz@localhost:5432/temp11';

class OrderDAO {
	constructor () {
		this.pool = createPool(connectionStr, {
      typeParsers: [
        {
          name: 'timestamptz',
          parse: (value) => value
            ? `${new Date(Date.parse(value)).toISOString().split('.')[0]}Z`
            : null
        }
      ]
    });
	}

	async getQueryResult (sql) {
		const result = await this.pool.query(sql);

		return { fileds: result.fields, rows: result.rows };
	}

	async queryWithTransaction (sqls) {
		try{
			return await this.pool.transaction( (connection) => {
				sqls.forEach( async (sql) => {
					try{
						await connection.query(sql);
					} catch (err) {
						console.log(err);
					}
					
				});

				return true;
			});
		} catch (err) {
			console.log(`error occured while running queries. msg: ${err}`);
			return false;
		}
	}
}

module.exports = new OrderDAO();