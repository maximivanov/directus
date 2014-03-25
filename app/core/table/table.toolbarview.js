define([
  "app",
  "backbone",
  "jquery-ui"
],

function(app, Backbone) {

  "use strict";

  var TableToolbarView = Backbone.Layout.extend({

    template: 'table-toolbar',

    events: {

      'click #set-visibility > button': function(e) {
        var value = $(e.target).closest('button').attr('data-value');
        var collection = this.collection;

        var $checked = $('.select-row:checked');
        var expectedResponses = $checked.length;

        var success = function() {
          expectedResponses--;
          if (expectedResponses === 0) {
            collection.trigger('visibility');
          }
        };

        $checked.each(function() {
          var id = this.value;
          console.log(id);
          var model = collection.get(id);
          model.save({active: value}, {silent: true, patch:true, validate:false, success: success});
        });

      },

      'click #visibility .dropdown-menu li > a': function(e) {
        var value = $(e.target).attr('data-value');
        this.collection.setFilter({currentPage: 0, active: value});
        this.collection.fetch();
        this.options.preferences.save({active: value});
      },
      
      'click a.pag-next:not(.disabled)': function() {
        var page = this.collection.getFilter('currentPage') + 1;
        this.collection.filters.currentPage = page;
        this.collection.fetch();
      },
      
      'click a.pag-prev:not(.disabled)': function() {
        var page = this.collection.getFilter('currentPage') - 1;
        this.collection.filters.currentPage = page;
        this.collection.fetch();
      },
      
      'keydown': function(e) {
        if (e.keyCode === 39 && (this.collection.getFilter('currentPage') + 1 < (this.collection.total / this.collection.getFilter('perPage')))) {
          this.collection.setFilter('currentPage', this.collection.filters.currentPage + 1);
          this.collection.fetch();
        }
        if (e.keyCode === 37 && this.collection.getFilter('currentPage') > 0) {
          this.collection.setFilter('currentPage', this.collection.getFilter('currentPage') - 1);
          this.collection.fetch();
        }
      },
      
      'keypress #table-filter': function(e) {
        if (e.which == 13) {
          var text = $('#table-filter').val();
          this.collection.setFilter('search', text);
          this.collection.setFilter('currentPage', 0);
          this.collection.fetch();
          this.collection.trigger('search', text);
        }
      },
      
      'click .add-filter-row': function(e) {
        var $filterRow = this.getFilterRow;
        $filterRow.clone(true).appendTo(".advanced-search-fields");
      },

      'click #batch-edit': function(e) {
        var $checked = $('.select-row:checked');
        var ids = $checked.map(function() {
          return this.value;
        }).toArray().join();

        var route = Backbone.history.fragment.split('/');
        route.push(ids);
        app.router.go(route);
      }
    },

    serialize: function() {

      var table = this.options.collection.table;
      var options = {};

      options.totalCount = this.collection.getTotalCount();
      options.lBound = Math.min(this.collection.getFilter('currentPage') * this.collection.getFilter('perPage') + 1, options.totalCount);
      options.uBound = Math.min(options.totalCount, options.lBound + this.collection.getFilter('perPage') - 1);
      options.pageNext = (this.collection.getFilter('currentPage') + 1 < (options.totalCount / this.collection.getFilter('perPage') ) );
      options.pagePrev = (this.collection.getFilter('currentPage') !== 0);

      options.actionButtons = (this.actionButtons && this.active); //(this.options.table.selection.length > 0);
      options.batchEdit = this.batchEdit;

      if (this.active) {
        options.visibility = _.map([
          {text:'All', value: '1,2', count: table.get('total')},
          {text:'Active', value: '1', count: table.get('active')},
          {text:'Inactive', value: '2', count: table.get('inactive')},
          {text:'Trash', value: '0', count: table.get('trash')}], function(obj) {
            if (this.collection.getFilter('active') == obj.value) { obj.active = true; }
            return obj;
        }, this);
      }

      options.filterText = this.collection.getFilter('search');
      options.filter = true;
      options.paginator = (options.pageNext || options.pagePrev);
      options.deleteOnly = this.options.deleteOnly && this.actionButtons;

      options.visibilityButtons = options.actionButtons || options.deleteOnly;

      return options;
    },

    setFilterRow: function(){
      var $advSearchFieldRow = $(".advanced-search-fields-row");
      var $advSearchFields = $(".advanced-search-fields");
          $advSearchFields.on("click", ".remove-adv-row", function(e){
            $(this).parent().remove();
          });
      this.getFilterRow = $advSearchFieldRow;
    },

    getFilterRow: "adv search fields row object",

    afterRender: function() {
      var $filter = $('#table-filter');
      if ($filter[0]) {
        $filter.val($filter.val());
      }

      this.setFilterRow();
    },

    initialize: function() {
      //Does the table have the active column?
      this.active = this.options.structure && this.options.structure.get('active') && !this.options.deleteOnly;
      //Show action buttons if there are selected models
      this.collection.on('select', function() {
        this.actionButtons = Boolean($('.select-row:checked').length);
        this.batchEdit = $('.select-row:checked').length > 1;
        this.render();
      }, this);

      //this.collection.on('visibility', this.render, this);
    }
  });

  return TableToolbarView;

});