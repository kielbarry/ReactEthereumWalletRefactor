<template name="layout_header">
    <nav>
        <ul>
            <li>
                <a href="{{pathFor route='dashboard'}}" class="{{isActiveRoute regex='dashboard'}}">
                    <i class="icon-wallet"></i>
                    <span>{{i18n 'wallet.app.buttons.wallet'}}</span>
                </a>
            </li>
            <li>
                <a href="{{goToSend}}" class="{{isActiveRoute regex='send'}}">
                    <i class="icon-arrow-up"></i>
                    <span>{{i18n 'wallet.app.buttons.send'}}</span>
                </a>
            </li>            
            
            <li class="block-info dapp-flex-item  {{#if TemplateVar.get 'syncing'}}syncing{{/if}}">
                {{#if isWalletMode}}

                    {{#if $eq ($.Session.get "network") "test"}}
                        <span class="private-chain" title="{{i18n 'wallet.app.texts.testnetExplain'}}">TEST-NET</span> &nbsp;&nbsp; 
                    {{/if}}
                    {{#if $eq ($.Session.get "network") "private"}}
                        <span class="private-chain" title="{{i18n 'wallet.app.texts.testnetExplain'}}">PRIVATE-NET</span> &nbsp;&nbsp; 
                    {{/if}}

                    {{#with TemplateVar.get "syncing"}}
                        <span class="text">
                            <i class="icon-feed"></i> {{$.Session.get "peerCount"}} <span class="hide-on-small">{{i18n 'wallet.app.texts.peers'}}</span>
                            &nbsp;&nbsp;|&nbsp;&nbsp;
                            <i class="icon-layers"></i> {{i18n "wallet.app.texts.nodeSyncing" blockDiff=blockDiff}}
                            &nbsp;&nbsp;|&nbsp;&nbsp;
                            <i class="icon-cloud-download"></i> {{progress}}%
                            <br>
                        </span>
                        <progress max="100" value="{{progress}}"></progress>
                    {{else}}
                        <i class="icon-feed"></i> {{$.Session.get "peerCount"}} <span class="hide-on-small">{{i18n 'wallet.app.texts.peers'}}</span>
                        &nbsp;&nbsp;|&nbsp;&nbsp;
                        <i class="icon-layers"></i> {{formattedBlockNumber}} <i class="icon-clock" style="margin-left: 10px;"></i> {{{timeSinceBlock}}} <span class="hide-on-small">{{{timeSinceBlockText}}}</span>
                    {{/with}}
                {{/if}}
            </li>
            <li>
                <a href="{{pathFor route='contracts'}}" class="{{isActiveRoute regex='contracts'}}">
                    <i class="icon-docs"></i>
                    <span>{{i18n 'wallet.app.buttons.contracts'}}</span>
                </a>
            </li>
            <li class="wallet-balance">
                <h3>{{i18n 'wallet.app.texts.balance'}}</h3>
                {{> elements_balance balance=totalBalance changeUnit=true}}
            </li>

            </ul>
    </nav>
</template>


/**
Template Controllers

@module Templates
*/

/**
The header template

@class [template] layout_header
@constructor
*/

Template['layout_header'].onCreated(function(){
    var template = this;
});


Template['layout_header'].helpers({
    /**
    Returns the correct url for the send to route

    @method (goToSend)
    @return {String}
    */
    'goToSend': function() {
        FlowRouter.watchPathChange();
        var address = web3.toChecksumAddress(FlowRouter.getParam('address'));  
        var accounts = EthAccounts.find({}).fetch();

        // For some reason the path /send/ doesn't show tokens anymore
        return (address)
            ? FlowRouter.path('sendFrom', {from: address})
            : FlowRouter.path('sendFrom', {from: accounts[0] ? accounts[0].address : null });
    },
    /**
    Calculates the total balance of all accounts + wallets.

    @method (totalBalance)
    @return {String}
    */
    'totalBalance': function(){
        var accounts = EthAccounts.find({}).fetch();
        var wallets = Wallets.find({owners: {$in: _.pluck(accounts, 'address')}}).fetch();

        var balance = _.reduce(_.pluck(_.union(accounts, wallets), 'balance'), function(memo, num){ return memo + Number(num); }, 0);

        updateMistBadge();

        return balance;
    },
    /**
    Formats the last block number

    @method (formattedBlockNumber)
    @return {String}
    */
    'formattedBlockNumber': function() {
        return numeral(EthBlocks.latest.number).format('0,0');
    },
    /**
    Gets the time since the last block

    @method (timeSinceBlock)
    */
    'timeSinceBlock': function () {
        
        if (EthBlocks.latest.timestamp == 0 
            || typeof EthBlocks.latest.timestamp == 'undefined')   
            return false;

        var timeSince = moment(EthBlocks.latest.timestamp, "X");
        var now = moment();
        var diff = now.diff(timeSince, "seconds");

        if (diff > 60 * 5) {
            Helpers.rerun["10s"].tick();
            return '<span class="red">' + timeSince.fromNow(true) + '</span>';
        } else if (diff > 60) {
            Helpers.rerun["10s"].tick();
            return timeSince.fromNow(true);
        } else if (diff < 2) {
            Helpers.rerun["1s"].tick();
            return ''
        } else {
            Helpers.rerun["1s"].tick();
            return diff + "s ";
        }
    },
    /**
    Formats the time since the last block

    @method (timeSinceBlockText)
    */
    'timeSinceBlockText': function () {
        
        if (EthBlocks.latest.timestamp == 0 
            || typeof EthBlocks.latest.timestamp == 'undefined')   
            return TAPi18n.__('wallet.app.texts.waitingForBlocks');

        var timeSince = moment(EthBlocks.latest.timestamp, "X");
        var now = moment();
        var diff = now.diff(timeSince, "seconds");

        if (diff > 60 * 5) {
            Helpers.rerun["10s"].tick();
            return '<span class="red">' + TAPi18n.__('wallet.app.texts.timeSinceBlock') + '</span>';
        } else if (diff > 60) {
            Helpers.rerun["10s"].tick();
            return TAPi18n.__('wallet.app.texts.timeSinceBlock');
        } else if (diff < 2) {
            Helpers.rerun["1s"].tick();
            return '<span class="blue">' + TAPi18n.__('wallet.app.texts.blockReceived') + '</span>';
        } else {
            Helpers.rerun["1s"].tick();
            return TAPi18n.__('wallet.app.texts.timeSinceBlock');
        }
    }
});