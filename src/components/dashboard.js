<template name="views_dashboard">
    {{#if isMist }}
      {{>mist_alert}}
    {{/if}}

    <div class="dapp-container">

        <h1>{{{i18n "wallet.accounts.title"}}}</h1>

        {{#if pendingConfirmations}}
            <h2>{{i18n 'wallet.transactions.pendingConfirmations'}}</h2>

            {{> elements_transactions_table collection="PendingConfirmations" ids=pendingConfirmations }}

        {{/if}}

        {{#if hasAccounts}}

            <h2>{{i18n "wallet.accounts.accountsTitle"}}</h2>
            <p>
                {{i18n "wallet.accounts.accountsDescription"}}
            </p>
            <div class="dapp-clear-fix"></div>

            <div class="wallet-box-list">
                {{#each accounts}}
                    {{> elements_account account=_id}}
                {{/each}}
            </div>

            {{#if isMist}}
                <button class="wallet-box create account">
                    <div class="account-pattern">
                        +
                    </div>
                    <h3>{{i18n "wallet.app.buttons.addAccount"}}</h3>
                </button>
            {{/if}}


            <h2>{{i18n "wallet.accounts.walletsTitle"}}</h2>

            {{#if hasMinimumBalance}}
                <p>
                    {{i18n "wallet.accounts.walletsDescription"}}
                </p>
            {{else}}
                <p>
                    {{{i18n "wallet.accounts.walletsDescriptionNotEnoughFunds"}}}
                </p>
            {{/if}}



            <div class="wallet-box-list">
            {{#each wallets}}
                {{> elements_account account=_id wallets=true}}
            {{/each}}
            </div>

            {{#if hasMinimumBalance}}
                <a href="{{pathFor route='createAccount'}}" class="wallet-box create">
                    <div class="account-pattern">
                        +
                    </div>
                    <h3>{{i18n "wallet.app.buttons.addWallet"}}</h3>
                </a>
            {{/if}}

        {{else}}
            <div class="col col-5 mobile-full ">
                <br>
                {{#if isMist}}
                    <button class="wallet-box create account">
                        <div class="account-pattern">
                            +
                        </div>
                        <h3>{{i18n "wallet.app.buttons.addAccount"}}</h3>
                    </button>
                {{/if}}
            </div>
            <div class="col col-5 mobile-full ">
                <h3>{{i18n "wallet.app.texts.noAccounts.title"}}</h3>
                <p>{{i18n "wallet.app.texts.noAccounts.text"}}</p>
            </div>
        {{/if}}

        <div class="dapp-clear-fix"></div>


        {{#if allTransactions}}
            <h2>{{i18n 'wallet.transactions.latest'}}</h2>

            {{> elements_transactions_table limit=5}}

        {{else}}

            <h2>{{i18n 'wallet.transactions.none'}}</h2>
        {{/if}}
    </div>
</template>


/**
Template Controllers

@module Templates
*/

/**
The dashboard template

@class [template] views_dashboard
@constructor
*/


Template['views_dashboard'].helpers({
    /**
    Get all current wallets

    @method (wallets)
    */
    'wallets': function(){
        var wallets = Wallets.find({$or: [{disabled: {$exists: false}}, {disabled: false}]}, {sort: {creationBlock: 1}}).fetch();

        // sort wallets by balance
        wallets.sort(Helpers.sortByBalance);

        return wallets;
    },
    /**
    Get all current accounts

    @method (accounts)
    */
    'accounts': function(){
        // balance need to be present, to show only full inserted accounts (not ones added by mist.requestAccount)
        var accounts = EthAccounts.find({name: {$exists: true}}, {sort: {name: 1}}).fetch();

        accounts.sort(Helpers.sortByBalance);

        return accounts;
    },
    /**
    Are there any accounts?

    @method (hasAccounts)
    */
    'hasAccounts' : function() {
        return (EthAccounts.find().count() > 0);
    },
    /**
    Are there any accounts?

    @method (hasAccounts)
    */
    'hasMinimumBalance' : function() {

        var enoughBalance = false;
        _.each(_.pluck(EthAccounts.find({}).fetch(), 'balance'), function(bal){
            if(new BigNumber(bal, '10').gt(1000000000000000)) enoughBalance = true;
        });

        return enoughBalance;
    },
    /**
    Get all transactions

    @method (allTransactions)
    */
    'allTransactions': function(){
        return Transactions.find({}, {sort: {timestamp: -1}}).count();
    },
    /**
    Returns an array of pending confirmations, from all accounts

    @method (pendingConfirmations)
    @return {Array}
    */
    'pendingConfirmations': function(){
        return _.pluck(PendingConfirmations.find({operation: {$exists: true}, confirmedOwners: {$ne: []}}).fetch(), '_id');
    }
});


Template['views_dashboard'].events({
    /**
    Request to create an account in mist

    @event click .create.account
    */
    'click .create.account': function(e){
        e.preventDefault();

        mist.requestAccount(function(e, accounts) {
            if(!e) {
                if(!_.isArray(accounts)) {
                    accounts = [accounts];
                }
                accounts.forEach(function(account){
                    account = account.toLowerCase();
                    EthAccounts.upsert({address: account}, {$set: {
                        address: account,
                        new: true
                    }});
                });
            }
        });
    }
});