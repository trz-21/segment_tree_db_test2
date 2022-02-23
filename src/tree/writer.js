
const dbConnector = require('../db/dbconnector');
const { v4: uuidv4 } = require('uuid');


class TreeWriter{
  constructor(){
    this.dbConnector = dbConnector;
  }

  _generateID(){
    return uuidv4();
  }

  async addItem(item){
    const root = await this.dbConnector.getRootNode();
    if(root === null){
      await this._initilizeRoot(item);
    }else if(root.is_full || !root.left_id){
      const newRoot = await this._extendTree(root);
      await this._addItem(newRoot, item);
    }else{
      await this._addItem(root, item);
    }
  }

  async _initilizeRoot(item){
    const root = {
      ...item,
      is_full: true,
      id: 'root'
    };

    await this.dbConnector.upsertNode(root);
  }

  async _extendTree(root){
    const currentTreeHeight = await this.dbConnector.getTreeHeight(root);

    const newNodes = [];
    for(let i = 0; i < Math.pow(2, currentTreeHeight + 1) - 1; i ++){
      newNodes.push({
        id: this._generateID(),
        market_id: root.market_id,
        is_full: false
      });
    }

    // child 할당해놓은 new nodes
    const newNodesWithChild = newNodes.map((node, idx) => {
      const newNode = node;

      // leaf가 아니면 좌우 child 할당
      if(idx * 2 + 1 < newNodes.length){
        newNode.left_id = newNodes[idx * 2 + 1].id;
        newNode.right_id = newNodes[idx * 2 + 2].id;
      }

      return newNode;
    });

    for(const node of newNodesWithChild){
      await this.dbConnector.upsertNode(node);
    }

    await this.dbConnector.deleteNode('root');
    
    root.id = this._generateID();

    const newRoot = {
      ...root,
      id: 'root',
      left_id: root.id,
      right_id: newNodesWithChild[0].id,
    };

    await this.dbConnector.upsertNode(newRoot);
    await this.dbConnector.upsertNode(root);
    return newRoot;
  }

  async _addItem(currentNode, item){
    //leaf노드일 경우 value update하고 리턴
    if(!currentNode.left_id && !currentNode.right_id){
      const newNode = {
        ...currentNode,
        ...item,
        is_full: true
      };

      await this.dbConnector.upsertNode(newNode);
      return newNode;
    }
    
    //leaf노드가 아니면 좌우 child 확인하여 add
    const leftNode = await this.dbConnector.getItemByIDTree(currentNode.left_id);
    let newCurrentNode = {};
    if(leftNode.is_full === false){
      const newLeftNode = await this._addItem(leftNode, item);
      newCurrentNode = {
        ...currentNode,
        start_time: newLeftNode.start_time,
        end_time: newLeftNode.end_time,
        val: newLeftNode.val
      };
    }else{
      const rightNode = await this.dbConnector.getItemByIDTree(currentNode.right_id);
      const newRightNode = await this._addItem(rightNode, item);
      newCurrentNode = {
        ...currentNode,
        is_full: newRightNode.is_full,
        end_time: newRightNode.end_time,
        val: Number(leftNode.val) + Number(newRightNode.val)
      };
    }

    await this.dbConnector.upsertNode(newCurrentNode);
    return newCurrentNode;
  }

  async updateItem(item){
    const root = await this.dbConnector.getRootNode(item.market_id);

    if(await this._updateItem(root, item)){
      return true;
    }else{
      return false;
    }
  }

  /**
   * 재귀로 tree update
   * @param {Object} currentNode 
   * @param {Object} item 
   * @returns 성공할 시 update된 currentNode, 실패할 시 null
   */
  async _updateItem(currentNode, item){
    const start_time = item.start_time;
    const end_time = item.end_time;

    if(currentNode === null){
      return null;
    }else if(start_time > currentNode.end_time || end_time < currentNode.start_time){
      return null;
    }else if(start_time === currentNode.start_time && end_time === currentNode.end_time){
      // leaf노드일 때 그냥 덮어쓰워서 업데이트
      const newCurrentNode = {
        ...currentNode,
        val: item.val
      };
      await this.dbConnector.upsertNode(currentNode);
      return newCurrentNode;
    }else{
      const leftNode = await this.dbConnector.getItemByIDTree(currentNode.left_id);
      const rightNode = await this.dbConnector.getItemByIDTree(currentNode.right_id);

      // left node로 먼저 업데이트 시도
      const leftResult = await this._updateItem(leftNode, item);
      if(leftResult){
        //right Node는 값이 없을 수도 있으므로, 이를 고려하여 처리
        const newCurrentNode = {
          ...currentNode,
          val: rightNode.val? Number(leftResult.val) + Number(rightNode.val) : leftResult.val
        };
        await this.dbConnector.upsertNode(newCurrentNode);

        return newCurrentNode;
      }

      const rightResult = await this._updateItem(rightNode, item);
      if(rightResult){
        const newCurrentNode = {
          ...currentNode,
          val: Number(leftNode.val) + Number(rightResult.val)
        };
        await this.dbConnector.upsertNode(newCurrentNode);

        return newCurrentNode;
      }

      //모두 실패
      return null;
    }
  }
}


module.exports = TreeWriter;