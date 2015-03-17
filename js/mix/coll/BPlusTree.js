/**
 * Reworked version of B+ Tree of Graham O'Neill
 * Created by Big on 15.03.2015.
 * <br/>
 B+ Tree processing
 Version 1.0.3
 Written by Graham O'Neill, April 2013
 http://goneill.co.nz/btree.php
 It's released under the MIT license,
 so feel free to use this as you wish but please don't claim it to be your own work,
 and if you use it in a real application please let me know so I can see it in use.
 If you find any bugs you can report them by using the Comments section below or the Contact page.
 */
mix.declare("mix.coll.BPlusTree", function()
{
	"use strict";
	//-----------------------------------------------------------------------------------------------------------------------
	function Leaf()
	{
		this.keyval = [];
		this.recnum = [];
		this.prevLf = null;
		this.nextLf = null;
	};
	//-----------------------------------------------------------------------------------------------------------------------
	Leaf.prototype.isLeaf = function()
	{
		return true;
	};
	Leaf.prototype.getItem = function(key, near)
	{
		var arr = this.keyval;
		var low = 0, high = arr.length - 1, mid, midVal;
		while(low <= high)
		{
			mid = (low + high) >>> 1;
			midVal = arr[mid];
			if(midVal < key)
			{
				low = mid + 1;
			}
			else if(midVal > key)
			{
				high = mid - 1;
			}
			else
			{
				return mid; // key found
			}
		}
		if(near)
		{
			return low;
		}
		return -1;  // key not found.
	};
	Leaf.prototype.addKey = function(key, rec)
	{
		var keys = this.keyval;
		var low = 0, high = keys.length - 1, mid, midVal;
		while(low <= high)
		{
			mid = (low + high) >>> 1;
			midVal = keys[mid];
			if(midVal < key)
			{
				low = mid + 1;
			}
			else if(midVal > key)
			{
				high = mid - 1;
			}
			else
			{
				return mid;
			}
		}
		var values = this.values;
		for(var i = keys.length; i > low; i--)
		{
			keys[i] = keys[i - 1];
			values[i] = values[i - 1];
		}
		keys[low] = key;
		values[low] = rec;
		return low;
	};
	Leaf.prototype.split = function()
	{
		var mov = this.keyval.length >>> 1;
		var newLeaf = new Leaf();
		for(var i = mov - 1; i >= 0; i--)
		{
			newLeaf.keyval[i] = this.keyval.pop();
			newLeaf.recnum[i] = this.recnum.pop();
		}
		newLeaf.prevLf = this;
		newLeaf.nextLf = this.nextLf;
		if(this.nextLf !== null)
		{
			this.nextLf.prevLf = newLeaf;
		}
		this.nextLf = newLeaf;
		return newLeaf;
	};
	Leaf.prototype.merge = function(frNod, paNod, frKey)
	{
		for(var i = 0, len = frNod.keyval.length; i < len; i++)
		{
			this.keyval[this.keyval.length] = frNod.keyval[i];
			this.recnum[this.recnum.length] = frNod.recnum[i];
		}
		this.nextLf = frNod.nextLf;
		if(frNod.nextLf !== null)
		{
			frNod.nextLf.prevLf = this;
		}
		frNod.prevLf = null;
		frNod.nextLf = null;
		var parentNodeLen = paNod.keyval.length - 1;
		for(var i = parentNodeLen; i >= 0; i--)
		{
			if(paNod.keyval[i] == frKey)
			{
				parentNodeLen = i;
				break;
			}
		}
		for(var i = parentNodeLen, len = paNod.keyval.length - 1; i < len; i++)
		{
			paNod.keyval[i] = paNod.keyval[i + 1];
			paNod.nodptr[i + 1] = paNod.nodptr[i + 2];
		}
		paNod.keyval.pop();
		paNod.nodptr.pop();
	};
	//-----------------------------------------------------------------------------------------------------------------------
	function Node()
	{
		this.keyval = [];
		this.nodptr = [];
	};
	//-----------------------------------------------------------------------------------------------------------------------
	Node.prototype.isLeaf = function()
	{
		return false;
	};
	Node.prototype.getItem = function(key)
	{
		//TODO optimize
		var keys = this.keyval;
		for(var i = 0, len = keys.length; i < len; i++)
		{
			if(keys[i] > key)
			{
				return i;
			}
		}
		return keys.length;
	};
	Node.prototype.addKey = function(key, ptrL, ptrR)
	{
		var keys = this.keyval;
		var itm = keys.length;
		//TODO optimize
		for(var i = 0, len = keys.length; i < len; i++)
		{
			if(key <= keys[i])
			{
				itm = i;
				break;
			}
		}
		for(var i = keys.length; i > itm; i--)
		{
			keys[i] = keys[i - 1];
			this.nodptr[i + 1] = this.nodptr[i];
		}
		keys[itm] = key;
		this.nodptr[itm] = ptrL;
		this.nodptr[itm + 1] = ptrR;
	};
	Node.prototype.split = function()
	{
		var mov = ((this.keyval.length >>> 1) + (this.keyval.length & 1)) - 1; //Math.ceil(this.keyval.length/2) - 1;
		var newNode = new Node();
		newNode.nodptr[mov] = this.nodptr.pop();
		for(var i = mov - 1; i >= 0; i--)
		{
			newNode.keyval[i] = this.keyval.pop();
			newNode.nodptr[i] = this.nodptr.pop();
		}
		return newNode;
	};
	Node.prototype.merge = function(frNod, paNod, paItm)
	{
		var del = paNod.keyval[paItm];
		this.keyval.push(del);
		for(var i = 0, len = frNod.keyval.length; i < len; i++)
		{
			this.keyval.push(frNod.keyval[i]);
			this.nodptr.push(frNod.nodptr[i]);
		}
		this.nodptr.push(frNod.nodptr[frNod.nodptr.length - 1]);
		for(var i = paItm, len = paNod.keyval.length - 1; i < len; i++)
		{
			paNod.keyval[i] = paNod.keyval[i + 1];
			paNod.nodptr[i + 1] = paNod.nodptr[i + 2];
		}
		paNod.keyval.pop();
		paNod.nodptr.pop();
		return del;
	};
	//-----------------------------------------------------------------------------------------------------------------------
	function BPlusTree(order)
	{
		order = Math.max(3, 0 | order);
		// Private
		this.root = new Leaf();
		this.maxkey = order - 1;
		this.minkyl = order >>> 1;
		this.minkyn = this.maxkey >>> 1;
		this.leaf = null;
		this.item = -1;
		// Public
		this.keyval = '';
		this.recnum = -1;
		this.length = 0;
		this.eof = true;
		this.found = false;
	};
	//-----------------------------------------------------------------------------------------------------------------------
	BPlusTree.prototype.insert = function(key, rec)
	{
		var stack = [];
		this.leaf = this.root;
		while(!this.leaf.isLeaf())
		{
			stack.push(this.leaf);
			this.item = this.leaf.getItem(key);
			this.leaf = this.leaf.nodptr[this.item];
		}
		this.item = this.leaf.addKey(key, rec);
		this.keyval = key;
		this.eof = false;
		if(this.item === -1)
		{
			this.found = true;
			this.item = this.leaf.getItem(key, false);
			this.recnum = this.leaf.recnum[this.item];
		}
		else
		{
			this.found = false;
			this.recnum = rec;
			this.length++;
			if(this.leaf.keyval.length > this.maxkey)
			{
				var pL = this.leaf;
				var pR = this.leaf.split();
				var ky = pR.keyval[0];
				this.item = this.leaf.getItem(key, false);
				if(this.item === -1)
				{
					this.leaf = this.leaf.nextLf;
					this.item = this.leaf.getItem(key, false);
				}
				while(true)
				{
					if(stack.length === 0)
					{
						var newN = new Node();
						newN.keyval[0] = ky;
						newN.nodptr[0] = pL;
						newN.nodptr[1] = pR;
						this.root = newN;
						break;
					}
					var nod = stack.pop();
					nod.addKey(ky, pL, pR);
					if(nod.keyval.length <= this.maxkey)
					{
						break;
					}
					pL = nod;
					pR = nod.split();
					ky = nod.keyval.pop();
				}
			}
		}
		return (!this.found);
	};
	BPlusTree.prototype.remove = function(key)
	{
		if(key === undefined)
		{
			if(this.item === -1)
			{
				this.eof = true;
				this.found = false;
				return false;
			}
			key = this.leaf.keyval[this.item];
		}
		this._del(key);
		if(!this.found)
		{
			this.item = -1;
			this.eof = true;
			this.keyval = '';
			this.recnum = -1;
		}
		else
		{
			this.seek(key, true);
			this.found = true;
		}
		return (this.found);
	};
	BPlusTree.prototype.seek = function(key, near)
	{
		near = !!near;
		this.leaf = this.root;
		while(!this.leaf.isLeaf())
		{
			this.item = this.leaf.getItem(key);
			this.leaf = this.leaf.nodptr[this.item];
		}
		this.item = this.leaf.getItem(key, near);
		if(near && this.item === -1 && this.leaf.nextLf !== null)
		{
			this.leaf = this.leaf.nextLf;
			this.item = 0;
		}
		if(this.item === -1)
		{
			this.eof = true;
			this.keyval = '';
			this.found = false;
			this.recnum = -1;
		}
		else
		{
			this.eof = false;
			this.found = (this.leaf.keyval[this.item] === key);
			this.keyval = this.leaf.keyval[this.item];
			this.recnum = this.leaf.recnum[this.item];
		}
		return (!this.eof);
	};
	BPlusTree.prototype.skip = function(count)
	{
		count = count | 0;
		//		if (typeof count !== 'number'){ count = 1; }
		if(this.item === -1 || this.leaf === null)
		{
			this.eof = true;
		}
		if(count > 0)
		{
			while(!this.eof && this.leaf.keyval.length - this.item - 1 < count)
			{
				count = count - this.leaf.keyval.length + this.item;
				this.leaf = this.leaf.nextLf;
				if(this.leaf === null)
				{
					this.eof = true;
				}
				else
				{
					this.item = 0;
				}
			}
			if(!this.eof)
			{
				this.item = this.item + count;
			}
		}
		else
		{
			count = -count;
			while(!this.eof && this.item < count)
			{
				count = count - this.item - 1;
				this.leaf = this.leaf.prevLf;
				if(this.leaf === null)
				{
					this.eof = true;
				}
				else
				{
					this.item = this.leaf.keyval.length - 1;
				}
			}
			if(!this.eof)
			{
				this.item = this.item - count;
			}
		}
		if(this.eof)
		{
			this.item = -1;
			this.found = false;
			this.keyval = '';
			this.recnum = -1;
		}
		else
		{
			this.found = true;
			this.keyval = this.leaf.keyval[this.item];
			this.recnum = this.leaf.recnum[this.item];
		}
		return (this.found);
	};
	BPlusTree.prototype.goto = function(count)
	{
		if(count < 0)
		{
			this.goBottom();
			if(!this.eof)
			{
				this.skip(count + 1);
			}
		}
		else
		{
			this.goTop();
			if(!this.eof)
			{
				this.skip(count - 1);
			}
		}
		return (this.found);
	};
	BPlusTree.prototype.keynum = function()
	{
		if(this.leaf === null || this.item === -1)
		{
			return -1;
		}
		var count = this.item + 1;
		var ptr = this.leaf;
		while(ptr.prevLf !== null)
		{
			ptr = ptr.prevLf;
			count += ptr.keyval.length;
		}
		return count;
	};
	BPlusTree.prototype.goTop = function()
	{
		this.leaf = this.root;
		while(!this.leaf.isLeaf())
		{
			this.leaf = this.leaf.nodptr[0];
		}
		if(this.leaf.keyval.length === 0)
		{
			this.item = -1;
			this.eof = true;
			this.found = false;
			this.keyval = '';
			this.recnum = -1;
		}
		else
		{
			this.item = 0;
			this.eof = false;
			this.found = true;
			this.keyval = this.leaf.keyval[0];
			this.recnum = this.leaf.recnum[0];
		}
		return (this.found);
	};
	BPlusTree.prototype.goBottom = function()
	{
		this.leaf = this.root;
		while(!this.leaf.isLeaf())
		{
			this.leaf = this.leaf.nodptr[this.leaf.nodptr.length - 1];
		}
		if(this.leaf.keyval.length === 0)
		{
			this.item = -1;
			this.eof = true;
			this.found = false;
			this.keyval = '';
			this.recnum = -1;
		}
		else
		{
			this.item = this.leaf.keyval.length - 1;
			this.eof = false;
			this.found = true;
			this.keyval = this.leaf.keyval[this.item];
			this.recnum = this.leaf.recnum[this.item];
		}
		return (this.found);
	};
	BPlusTree.prototype.pack = function()
	{
		this.goTop(0);
		if(this.leaf === this.root)
		{
			return;
		}
		// Pack leaves
		var toN = new Leaf();
		var toI = 0;
		var frN = this.leaf;
		var frI = 0;
		var parKey = [];
		var parNod = [];
		while(true)
		{
			toN.keyval[toI] = frN.keyval[frI];
			toN.recnum[toI] = frN.recnum[frI];
			if(toI === 0)
			{
				parNod.push(toN);
			}
			if(frI === frN.keyval.length - 1)
			{
				if(frN.nextLf === null)
				{
					break;
				}
				frN = frN.nextLf;
				frI = 0;
			}
			else
			{
				frI++;
			}
			if(toI === this.maxkey - 1)
			{
				var tmp = new Leaf();
				toN.nextLf = tmp;
				tmp.prevLf = toN;
				toN = tmp;
				toI = 0;
			}
			else
			{
				toI++;
			}
		}
		var mov = this.minkyl - toN.keyval.length;
		frN = toN.prevLf;
		if(mov > 0 && frN !== null)
		{
			for(var i = toN.keyval.length - 1; i >= 0; i--)
			{
				toN.keyval[i + mov] = toN.keyval[i];
				toN.recnum[i + mov] = toN.recnum[i];
			}
			for(var i = mov - 1; i >= 0; i--)
			{
				toN.keyval[i] = frN.keyval.pop();
				toN.recnum[i] = frN.recnum.pop();
			}
		}
		for(i = 1, len = parNod.length; i < len; i++)
		{
			parKey.push(parNod[i].keyval[0]);
		}
		parKey[parKey.length] = null;
		// Rebuild nodes
		var kidKey, kidNod;
		while(parKey[0] !== null)
		{
			kidKey = parKey;
			kidNod = parNod;
			parKey = [];
			parNod = [];
			var toI = this.maxkey + 1;
			for(var i = 0, len = kidKey.length; i < len; i++)
			{
				if(toI > this.maxkey)
				{
					toN = new Node();
					toI = 0;
					parNod.push(toN);
				}
				toN.keyval[toI] = kidKey[i];
				toN.nodptr[toI] = kidNod[i];
				toI++;
			}
			mov = this.minkyn - toN.keyval.length + 1;
			if(mov > 0 && parNod.length > 1)
			{
				for(var i = toN.keyval.length - 1; i >= 0; i--)
				{
					toN.keyval[i + mov] = toN.keyval[i];
					toN.nodptr[i + mov] = toN.nodptr[i];
				}
				frN = parNod[parNod.length - 2];
				for(var i = mov - 1; i >= 0; i--)
				{
					toN.keyval[i] = frN.keyval.pop();
					toN.nodptr[i] = frN.nodptr.pop();
				}
			}
			for(var i = 0, len = parNod.length; i < len; i++)
			{
				parKey.push(parNod[i].keyval.pop());
			}
		}
		this.root = parNod[0];
		this.goTop();
		return (this.found);
	};
	// ----- Deletion methods -----
	BPlusTree.prototype._del = function(key)
	{
		var stack = [];
		var parNod = null;
		var parPtr = -1;
		this.leaf = this.root;
		while(!this.leaf.isLeaf())
		{
			stack.push(this.leaf);
			parNod = this.leaf;
			parPtr = this.leaf.getItem(key);
			this.leaf = this.leaf.nodptr[parPtr];
		}
		this.item = this.leaf.getItem(key, false);
		// Key not in tree
		if(this.item === -1)
		{
			this.found = false;
			return;
		}
		this.found = true;
		// Delete key from leaf
		for(var i = this.item, len = this.leaf.keyval.length - 1; i < len; i++)
		{
			this.leaf.keyval[i] = this.leaf.keyval[i + 1];
			this.leaf.recnum[i] = this.leaf.recnum[i + 1];
		}
		this.leaf.keyval.pop();
		this.leaf.recnum.pop();
		this.length--;
		// Leaf still valid: done
		if(this.leaf === this.root)
		{
			return;
		}
		if(this.leaf.keyval.length >= this.minkyl)
		{
			if(this.item === 0)
			{
				this._fixNodes(stack, key, this.leaf.keyval[0]);
			}
			return;
		}
		var delKey;
		// Steal from left sibling if possible
		var sibL = (parPtr === 0) ? null : parNod.nodptr[parPtr - 1];
		if(sibL !== null && sibL.keyval.length > this.minkyl)
		{
			delKey = (this.item === 0) ? key : this.leaf.keyval[0];
			for(var i = this.leaf.keyval.length; i > 0; i--)
			{
				this.leaf.keyval[i] = this.leaf.keyval[i - 1];
				this.leaf.recnum[i] = this.leaf.recnum[i - 1];
			}
			this.leaf.keyval[0] = sibL.keyval.pop();
			this.leaf.recnum[0] = sibL.recnum.pop();
			this._fixNodes(stack, delKey, this.leaf.keyval[0]);
			return;
		}
		// Steal from right sibling if possible
		var sibR = (parPtr == parNod.keyval.length) ? null : parNod.nodptr[parPtr + 1];
		if(sibR !== null && sibR.keyval.length > this.minkyl)
		{
			this.leaf.keyval.push(sibR.keyval.shift());
			this.leaf.recnum.push(sibR.recnum.shift());
			if(this.item === 0)
			{
				this._fixNodes(stack, key, this.leaf.keyval[0]);
			}
			this._fixNodes(stack, this.leaf.keyval[this.leaf.keyval.length - 1], sibR.keyval[0]);
			return;
		}
		// Merge left to make one leaf
		if(sibL !== null)
		{
			delKey = (this.item === 0) ? key : this.leaf.keyval[0];
			sibL.merge(this.leaf, parNod, delKey);
			this.leaf = sibL;
		}
		else
		{
			delKey = sibR.keyval[0];
			this.leaf.merge(sibR, parNod, delKey);
			if(this.item === 0)
			{
				this._fixNodes(stack, key, this.leaf.keyval[0]);
			}
		}
		if(stack.length === 1 && parNod.keyval.length === 0)
		{
			this.root = this.leaf;
			return;
		}
		var curNod = stack.pop();
		var parItm;
		// Update all nodes
		while(curNod.keyval.length < this.minkyn && stack.length > 0)
		{
			parNod = stack.pop();
			parItm = parNod.getItem(delKey);
			// Steal from right sibling if possible
			sibR = (parItm == parNod.keyval.length) ? null : parNod.nodptr[parItm + 1];
			if(sibR !== null && sibR.keyval.length > this.minkyn)
			{
				curNod.keyval.push(parNod.keyval[parItm]);
				parNod.keyval[parItm] = sibR.keyval.shift();
				curNod.nodptr.push(sibR.nodptr.shift());
				break;
			}
			// Steal from left sibling if possible
			sibL = (parItm === 0) ? null : parNod.nodptr[parItm - 1];
			if(sibL !== null && sibL.keyval.length > this.minkyn)
			{
				for(var i = curNod.keyval.length; i > 0; i--)
				{
					curNod.keyval[i] = curNod.keyval[i - 1];
				}
				for(var i = curNod.nodptr.length; i > 0; i--)
				{
					curNod.nodptr[i] = curNod.nodptr[i - 1];
				}
				curNod.keyval[0] = parNod.keyval[parItm - 1];
				parNod.keyval[parItm - 1] = sibL.keyval.pop();
				curNod.nodptr[0] = sibL.nodptr.pop();
				break;
			}
			// Merge left to make one node
			if(sibL !== null)
			{
				delKey = sibL.merge(curNod, parNod, parItm - 1);
				curNod = sibL;
			}
			else if(sibR !== null)
			{
				delKey = curNod.merge(sibR, parNod, parItm);
			}
			// Next level
			if(stack.length === 0 && parNod.keyval.length === 0)
			{
				this.root = curNod;
				break;
			}
			curNod = parNod;
		}
	};
	BPlusTree.prototype._fixNodes = function(stk, frKey, toKey)
	{
		var values, lvl = stk.length, mor = true;
		do{
			lvl--;
			values = stk[lvl].keyval;
			for(var i = values.length - 1; i >= 0; i--)
			{
				if(values[i] == frKey)
				{
					values[i] = toKey;
					mor = false;
					break;
				}
			}
		}
		while(mor && lvl > 0);
	}
	return BPlusTree;
});

