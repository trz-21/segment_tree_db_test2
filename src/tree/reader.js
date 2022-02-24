
const dbConnector = require('../db/dbconnector');
//const {StopWatch} = require('stopwatch-node');
//const sw = new StopWatch();

class TreeReader{
  constructor(){
    this.dbConnector = dbConnector;
    this.cnt = 0;
  }

  async searchRange(startTime, endTime){
    const rootNode = await this.dbConnector.getRootNode();
    
    const result = this._searchRange(rootNode, startTime, endTime);

    return result;
  }

  async _searchRange(currentNode, startTime, endTime){
    if(currentNode === null || currentNode.start_time === null){
      return null;
    }else if(currentNode.end_time <= startTime || currentNode.start_time >= endTime){
      // 범위 밖이라면 null 리턴
      return null;
    }else if(startTime <= currentNode.start_time && currentNode.end_time <= endTime){
      // 범위를 모두 포함하면, 이 노드의 정보 리턴
      return {
        val: currentNode.val
      };
    }else{
      // 그 외엔 left child와 right child 방문하여 값들 결정
      //sw.start('task11');
      const leftNode = await this.dbConnector.getItemByIDTree(currentNode.left_id);
      const rightNode=  await this.dbConnector.getItemByIDTree(currentNode.right_id);
      //sw.stop();sw.prettyPrint();

      const leftResult = await this._searchRange(leftNode, startTime, endTime);
      const rightResult = await this._searchRange(rightNode, startTime, endTime);

      if(leftResult === null && rightResult === null){
        return null;
      }else if(leftResult === null){
        return rightResult;
      }else if(rightResult === null){
        return leftResult;
      }else{
        return {
          val: Number(leftResult.val) + Number(rightResult.val)
        };
      }
    }
  }
}

module.exports = TreeReader;