$(document).ready(function() {
    checkLastUpdate();

    $('.loading').show();
    setTimeout(function() {
        filterAsset();
        getCompany();
    }, 10);    

    $(document).on('keyup','#searchAsset', function () {
        $("#assets-list > li").hide().filter(":contains(" + $(this).val() + ")").show();
    })

    $(document).on('change','#assetClassList', function () {
        const filter = $('#assetClassList').val();
        $("#assets-list > li").hide().filter(function(){
            return $(this).data('assetClass') == filter;
        }).show();
    })

    $(document).on('click','.assets-dropdown button', function () {

        if (  $(this).siblings('.collapseItem').css('display') == 'none' ){
            $('.collapseItem').hide();
            $(this).siblings('.collapseItem').show();
        }
        else{
            $(this).siblings('.collapseItem').show();
            $('.collapseItem').hide();
        }
    })

    $(document).on("submit", "#filterTreeForm", function (e) {
        e.preventDefault();
        var filter = {}
        var data = {};
        $("#filterTreeForm").serializeArray().map(function(x){data[x.name] = x.value;}); 
        filter.type = "search";
        filter.data = data;

        console.log("apps",filter);
        
        $('#filterListBtn').html('');
        $('#fieldset').hide();
        $('.loading').show();
        setTimeout(function() {
          getTree(filter);
        }, 10); 
    }) 


    $(document).on('click','#findAsset', function () {
        $('.loading').show();
        str =  $('#inpFindAsset').val();
        // input = $('#inpFindAsset');
        // if(str == ""){
        //     console.log(input);
        //     input.addClass('is-invalid')
        //     input.attr("placeholder", "Field is empty");
        //     setTimeout(function() {
        //         input.attr("placeholder", "Search...");
        //     },2000)
        //     $('.loading').hide();
        //     return ;
        // }
        // input.removeClass('is-invalid')

        $('#hasSelecteAssetIDFilter').remove()

        $('#filterListBtn').prepend(`<li id="hasSelecteAssetIDFilter" class"liFilter"><button  type="button" class="btn-primary sm ml-0 mb-4">
            <span>Asset ID : ${str} X</span> <input type="hidden" name="assetID" value="${str}"/></button>
        </li>`);
        
        if(!$('#clear-filter').length){
            $('#filterListBtn').append(`<button id="clear-filter" class="btn-primary sm ml-0 mb-4" 
            type="button" onclick="clearFilter()">Clear filters</button>`);
        }

        $(document).on("click","hasSelecteAssetIDFilter",function(){
            $('.loading').show();
            $(this).remove();
            setTimeout(function() {
                filterAsset();
            }, 50); 
        })

        setTimeout(function() {
            filterAsset();
        }, 10); 
    })
    
    $(document).on('keypress','#inpFindAsset', function (e) {
        if(e.which == "13"){
            $('#findAsset').click();
        }
    })
    $(document).on('keypress','#clear-filter', function (e) {
        $('#filterListBtn').html('');
        $('.loading').show();
        setTimeout(function() {
            getTree();
            getCompany();
            getAsset();
        }, 10); 
    })

    $(document).on('click','#findAllAsset', function () {
        $('#filterListBtn').html('');
        $('.loading').show();
        setTimeout(function() {
            getTree();
            getAsset();
        }, 10); 
    })
});

function toggleFildset(){
    $('#fieldset').toggle();
}

function ApplyFilter(e){
    e.preventDefault();
    var filter = {}
    var data = [];
    var requestData = {}

    $("#filterAsset").serializeArray().map(function(x){ 
        if(x.value == "false"){
            x.value = " ";
        }
        data[x.name] = x.value;
    }); 

    filter.type = "filter";
    filter.data = data;

    flag = false;
    $('#filterListBtn').html('');

    btnFilterList = "";
    for (key in data) {
      if(data[key] != ""){
        flag = true;
        btnFilterList = `<li id="hasSelecte${key}Filter" class"liFilter"><button  type="button" class="btn-primary sm ml-0 mb-4">
            <span>${key} : ${data[key]} X</span> <input type="hidden" name="${key}" value="${data[key] === " " ? true : data[key] }"/></button>
        </li>`;
        $('#filterListBtn').append(btnFilterList);

        document.getElementById('hasSelecte'+key+'Filter').onclick = (function(data) {
        return function (e) { 
            
                $('.loading').show();
                $(this).remove();

                setTimeout(function() {
                    filterAsset();
                }, 50); 
            };
        })(data[key]);
      }
    }
    filter.data = getFilterRequest();

    if(flag === true){
        btnFilterList = `<button id="clear-filter" class="btn-primary sm ml-0 mb-4" type="button" onclick="clearFilter()">Clear filters</button>`
        $('#filterListBtn').append(btnFilterList);
    }

    $('.loading').show();
    setTimeout(function() {
        filterAsset(filter.data);
    }, 10); 
} 

function getFilterRequest(){
    request = {}
    $('#filterListBtn li').each(function(index, el) {
        name = $(el).find('input').attr('name');
        value = $(el).find('input').val();
        request[name] = value;
    });

    // if no filter
    if(Object.keys(request).length === 0 && request.constructor === Object){
        $('#filterListBtn').html('');
    }
    return request;

}

function clearFilter(){
    $('.loading').show();
    $('#filterListBtn').html('');
    filter.data = getFilterRequest();
    setTimeout(function() {
        filterAsset(filter.data);
    }, 50); 
}

function reloadLS(){
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
}


// DataTable function
$.fn.DataTable.ext.pager.simple_numbers_no_ellipses = function(page, pages){
   var numbers = [];
   var buttons = $.fn.DataTable.ext.pager.numbers_length;
   var half = Math.floor( buttons / 2 );

   var _range = function ( len, start ){
      var end;
   
      if ( typeof start === "undefined" ){ 
         start = 0;
         end = len;

      } else {
         end = start;
         start = len;
      }

      var out = []; 
      for ( var i = start ; i < end; i++ ){ out.push(i); }
   
      return out;
   };
    

   if ( pages <= buttons ) {
      numbers = _range( 0, pages );

   } else if ( page <= half ) {
      numbers = _range( 0, buttons);

   } else if ( page >= pages - 1 - half ) {
      numbers = _range( pages - buttons, pages );

   } else {
      numbers = _range( page - half, page + half + 1);
   }

   numbers.DT_el = 'span';

   return [ 'first',numbers, 'last' ];
}; 

