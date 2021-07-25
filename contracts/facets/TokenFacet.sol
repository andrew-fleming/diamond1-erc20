// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IToken } from "../interfaces/IToken.sol";
import { Token } from "../libraries/LibAppStorage.sol";

contract TokenFacet {
    Token internal s;

    uint256 constant MAX_UINT = type(uint256).max;

    event Approval(address indexed _owner, address indexed _spender, uint256 _value);
    event Transfer(address indexed _from, address indexed _to, uint256 _value);

    function name() external view returns (string memory){
        return s.name;
    }

    function symbol() external view returns (string memory){
        return s.symbol;
    }

    function decimals() external view returns (uint8){
        return s.decimals;
    }

    function totalSupply() external view returns (uint256){
        return s.totalSupply;
    }

    function balanceOf(address _owner) external view returns (uint256 balance){
        return s.balances[_owner];
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) external returns (bool success){
        uint256 fromBalance = s.balances[_from];
        if (msg.sender == _from) {
            // pass
        } else {
            uint256 l_allowance = s.allowances[_from][msg.sender];
            require(l_allowance >= _value, "Token: Not allowed to transfer");
            if (l_allowance != MAX_UINT) {
                s.allowances[_from][msg.sender] = l_allowance - _value;
                emit Approval(_from, msg.sender, l_allowance - _value);
            }
        }
        require(fromBalance >= _value, "Token: Not enough tokens to transfer");
        s.balances[_from] = fromBalance - _value;
        s.balances[_to] += _value;
        emit Transfer(_from, _to, _value);
        success = true;
    }

    function transfer(address _to, uint256 _value) external returns (bool success){
        uint256 frombalances = s.balances[msg.sender];
        require(frombalances >= _value, "Token: Not enough tokens to transfer");
        s.balances[msg.sender] = frombalances - _value;
        s.balances[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        success = true;
    }

    function approve(address _spender, uint256 _value) external returns (bool success){
        s.allowances[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        success = true;
    }

    function allowance(address _owner, address _spender) external view returns (uint256 remaining){
        remaining = s.allowances[_owner][_spender];
    }

    /// @notice Basic mint function without access control.
    function mint(address _receiver, uint256 _value) external returns(bool success){
        s.balances[_receiver] += _value;
        s.totalSupply += _value;            
        emit Transfer(address(0), _receiver, _value); 
        success = true;       
    }

}
