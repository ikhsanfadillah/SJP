var env = {}
// env['baseAPIUrl'] ="http://testing-sjlmsagents.southeastasia.cloudapp.azure.com:84";
env['baseAPIUrl'] = "http://localhost:8080";

function fetchData(url,req = {}) {
    let json = null;
    const baseAPIUrl = env.baseAPIUrl;//49160:8080
    $.ajax({
        'async': false,
        'global': false,
        'url': baseAPIUrl+url,
        'data': req,
        'dataType': "json",
        'success': function (data) {
            json = data;
        },
        'fail': function(e){
            console.log(e);
        }
    });
    return json;
}

function checkLastUpdate(){
    if(typeof(Storage) !== "undefined") {
        if (localStorage.timestamp) {
            timestamp = JSON.parse(localStorage.timestamp);
            newTimestamp = fetchData('/api/timestamp');
            newTimestamp = newTimestamp[0].colRegDt;
            if(timestamp < newTimestamp){
                localStorage.clear();
                sessionStorage.clear();
            }
        } else {
            timestamp = fetchData('/api/timestamp');
            try{
                localStorage.setItem("timestamp", JSON.stringify(timestamp[0].colRegDt));
            }
            catch(err){
                console.log(err)
            }
        }
    }
    else console.log("your browse didnt support localStorage"); 
}

function getTree(filter) {
    // Initialize
    let LocTreePath,assetAmountData,data

    if(typeof(Storage) !== "undefined") {
        if (sessionStorage.LocTree) {
            data = JSON.parse(sessionStorage.LocTree);
        } else {
            data = fetchData('/api/filter-tblLoc');
            try {
                sessionStorage.setItem("LocTree", JSON.stringify(data));
            }
            catch(err) {
                console.log(err)
            } 
        }
    }
    else console.log("your browse didnt support localStorage"); 

    if(typeof filter !== 'undefined' && filter.hasOwnProperty('type') && filter['type'] === 'search'){

        for (var key in filter['data']) {
            let keyWord = filter.data[key].toLowerCase();
            if (filter[key] !== '') { data = data.filter((obj) => { return obj[key].toLowerCase().includes(keyWord) }); }

        }
        const zipCodeArr = data.map(zip => zip.zipCode)
        getAsset(zipCodeArr);
    }
    treeTemplate = transformData(data);
    renderParentTree(treeTemplate);
    
    $('.loading').hide();

}

// transform data to tree
function transformData(data){

    data = _(data).groupBy(TcLevel => TcLevel.tcCode)
        .map((value, key) => ({
            NodeID: key,
            NodeText: value[0].tc,
            amount: _.sumBy(value, 'amount'),
            ZipCodeArr: value.map(zip => zip.zipCode),
            children: _(value)
                .groupBy( y => y.ward)
                .map((value, key) => ({
                    NodeID: key.replace(/\s+/g, ''),
                    NodeText: key,
                    amount: _.sumBy(value, 'amount'),
                    ZipCodeArr: value.map(zip => zip.zipCode),
                        children: _(value)
                        .groupBy( z => z.pm)
                        .map((value,key) => ({
                            NodeID: key.replace(/\s+/g, ''),
                            NodeText: key,
                            ZipCodeArr: value.map(zip => zip.zipCode),
                            amount: _.sumBy(value, 'amount'),
                            children: _(value)
                                .map((value) => ({
                                NodeID: value.zipCode,
                                NodeText: "Block : "+value.block+" "+value.st+" "+value.zipCode,
                                ZipCodeArr: [value.zipCode],
                                amount: value.amount,
                                a  :   value.a || '',
                                f  :   value.f || '',
                                pt :   value.pt || '',
                                p :   value.p || ''
                            }))
                            .value()
                        }))
                    .value()
                }))
                .value()
        }))
        .value();
    data = data.filter(function( element ) {
       return element.NodeText !== "";
    });

    return data;
}


function renderParentTree(data, parentNodeID=0) {
    let treeHTML = '';
    $('.menu').html("");
    for(let i=0; i<=data.length-1 ; i++){
        const id = "tcID"+data[i].NodeID;

        treeHTML = `
        <li class="list-group-item">
          <i class="fa fa-chevron-right f" aria-hidden="true"></i>
          <span id="${id}">
            ${data[i].NodeText}
            <span class="badge badge-success">${data[i].amount}</span>
          </span>
          <ul id='childLists${data[i].NodeID}' class="list-group sub-menu wardLevel">
          </ul>
        </li>`;

        $('.menu').append(treeHTML);

        // Get the button, and when the user clicks on it, execute renderFunction
        document.getElementById(id).onclick = (function(currNode) {
            return function (e) { 
                
                $(e.target.nextElementSibling).addClass('activetree')
                $(e.target.nextElementSibling).html('')
                
                $('.sub-menu').html('');
                $('.sub-menu').hide();
                $('.loading').show();
                
                setTimeout(function() {
                    renderChildren(currNode);
                    getAsset(currNode.ZipCodeArr);
                }, 100); 

                $("ul.menu > li span").removeClass('activeSpan')

                this.classList.add("activeSpan");
            };
        })(data[i]);
    }
}

function renderChildren(currNode,parent) {
    let childNode = currNode.children;
    let treeHTML = '';
    for(let i=0; i<=childNode.length-1 ; i++){

        const id = "child"+childNode[i].NodeID;
        
        treeHTML = `
        <li class="list-group-item">
          <i class="fa fa-chevron-right f" aria-hidden="true"></i>
          <span id="${id}">
            ${childNode[i].NodeText} 
            <span class="badge badge-success">${childNode[i].amount}</span>
            ${ !childNode[i].children && childNode[i].a == "1" ? ' <i class="fa fa-bell text-danger"></i> ':''}
            ${ !childNode[i].children && childNode[i].f == "1" ? ' <i class="fa fa-exclamation-triangle text-danger"></i> ':''}
            ${ !childNode[i].children && childNode[i].pt == "1" ? ' <i class="fa fa-user-times text-danger"></i> ':''}
            
            
          </span>
          <ul id='childLists${childNode[i].NodeID}' class="list-group sub-menu wardLevel">
          </ul>
        </li>`;
        $('#childLists'+currNode.NodeID).append(treeHTML);
        $('#childLists'+currNode.NodeID).show();


        document.getElementById(id).onclick = (function(childNode) {
        return function (e) { 
                $('.loading').show();
                $(e.target.nextElementSibling).addClass('activetree')
                $(e.target.nextElementSibling).html('')

                $('.sub-menu').not($(e.target).parentsUntil('.menu')).html('');
                $('.sub-menu').not($(e.target).parentsUntil('.menu')).hide();

                if (childNode.children) {
                    renderChildren(childNode,currNode.NodeID)
                }
                $("ul.menu > li span").removeClass('activeSpan')

                this.classList.add("activeSpan");

                getAsset(childNode.ZipCodeArr);
            };
        })(childNode[i]);
        $('.loading').hide();

    }    

}

function getAsset(zipCodeArr){
    let assetList = [];
    let assetClass = ["LMD", "LMPD", "Lift","HLMD"];
    filter = getFilterRequest();
    if(jQuery.isEmptyObject(filter)){
        if (localStorage.tblAsset) {
            assetList = JSON.parse(localStorage.tblAsset);
        } else {
            assetList = fetchData('/api/filter-asset');
            try {
                localStorage.setItem("tblAsset", JSON.stringify(assetList));
            }
            catch(err) {
                console.log(err)
            } 
        }
    }
    else{
        assetList = JSON.parse(sessionStorage.tblAssetFilter);
    }

    assetAmountData = _(assetList).groupBy(asset => asset.colZipCode)
        .map((value, key) => ({
            zipCode: key,
            amount: value.length,
            }))
        .value();
    if(typeof(Storage) !== "undefined") {
        if (sessionStorage.LocTree) {
            LocTree = JSON.parse(sessionStorage.LocTree);
        } else {
            LocTree = fetchData('/api/filter-tblLoc');
            try {
                sessionStorage.setItem("LocTree", JSON.stringify(LocTree));
            }
            catch(err) {
                console.log(err)
            } 
        }
    }
    else console.log("your browse didnt support localStorage"); 

    // mapping for Asset Amount for each ZipCode
    // zipCodeArr = _.uniqBy(assetList, 'colZipCode').map((asset) => asset.colZipCode);


    let data = LocTree.map( obj1 => {
        const x = assetAmountData.find(obj2 => { return obj1.zipCode === obj2.zipCode; });
        (typeof x !== 'undefined') ? obj1.amount2 = +x.amount : obj1.amount2 = 0;
        return obj1;
    });
    if(typeof(zipCodeArr) !== "undefined") {
        zipCodeArr = zipCodeArr.map((x) => x.toString());
        assetList = assetList.filter((obj) => { return zipCodeArr.indexOf(obj.colZipCode) > -1; });
    }
    for (let i = 0; i < assetClass.length ; i++){
        renderAssetHTML(assetClass[i], assetList.filter((obj) => obj.colAssetClass == assetClass[i]))
    }
    $('.loading').hide();
    
}

// render and configuration datatable for assetlists
// @key = asset code. like LMD, Lift, LMPD, etc.. it passed from
function renderAssetHTML(key,data){

    $("#collapse"+key+" span.totalAsset").html('('+data.length+')');

    oTable = $('#collapse'+key+' table').DataTable({
    pagingType : "simple_numbers_no_ellipses",
    pageLength : 20,
    destroy : true,
    data : data,
    bLengthChange : false,
    bInfo : false,  
    drawCallback : function () {
        $('.dataTables_paginate > .pagination').addClass('pagination-sm');
    },
    columns : [
        {
            data : "colAssetID",
            render : function ( data, type, row, meta ) {
                template = '';
                if(row.colAssetClass == 'Lift'){
                    template = `
                        <div class="f-group">
                            <input type="checkbox" class="checkbox" name="selectedAssetsHMPD[]" id="hlmd${data}" value="${data}">
                            <label for="hlmd${data}" class="checkbox-label" style="margin-left: -1px;">
                                <a href="${data}">Lift ${row.dtl} : (${row.colAssetID})</a>
                                ${ row.a == "1" ? '<i class="fa fa-bell text-danger"></i>':''}
                                ${ row.f == "1" ? '<i class="fa fa-exclamation-triangle text-danger"></i>':''}
                                ${ row.pt == "1" ? '<i class="fa fa-user-times text-danger"></i>':''}
                            </label>
                        </div>`;
                }
                else{
                    template = `
                        <div class="f-group">
                            <input type="checkbox" class="checkbox" name="selectedAssetsHMPD[]" id="hlmd${data}" value="${data}">
                            <label for="hlmd${data}" class="checkbox-label" style="margin-left: -1px;"><a href="${data}">${data}</a>
                            ${ row.a == "1" ? '<i class="fa fa-bell text-danger"></i>':''}
                            ${ row.f == "1" ? '<i class="fa fa-exclamation-triangle text-danger"></i>':''}
                            ${ row.pt == "1" ? '<i class="fa fa-user-times text-danger"></i>':''}</label>
                        </div>`;
                }

                return template
            }            
        }
    ],
    language : {
        paginate : {
            first:    '«',
            last:     '»'
        }
      }
    });

    $(document).on('keyup','#searchAsset'+key, function () {
        tbl = $('#collapse'+key+' table').DataTable();
        tbl.search($(this).val()).draw() ;
    })
    $('.loading').hide();

}

function getCompany(){
    companyList = fetchData('/api/maintenance-company');
    companyListHTML = '<option value="" class="" selected="selected">ALL</option>';
    
    for (let i = 0; i < companyList.length; i++) {
        companyListHTML += `<option label="${companyList[i].companyName}" value="${companyList[i].companyName}">${companyList[i].companyName}</option>`;;
    }
    $('#idColMaintenanceCompanyId').html(companyListHTML);

}

function filterAsset(){
    let tblAst = null,
        tblLoc = null,
        assetClass = [],
        filter = getFilterRequest();

    assetClass = ["LMD", "LMPD", "Lift","HLMD"];

    tblAst = fetchData("/api/filter-asset",filter);
    tblLoc = fetchData("/api/filter-tblLoc", filter);
    
    // assetAmountData = _(tblAst).groupBy(asset => asset.colZipCode)
    //     .map((value, key) => ({
    //         zipCode: key,
    //         amount: value.length,
    //         }))
    //     .value();
    // tblLoc = JSON.parse(sessionStorage.LocTree);

    // // mapping for Asset Amount for each ZipCode
    // zipCodeArr = _.uniqBy(tblAst, 'colZipCode').map((asset) => asset.colZipCode);

    // console.log('zipCodeArr',zipCodeArr);

    // tblLoc = tblLoc.filter((obj) => { return zipCodeArr.indexOf(obj.zipCode) > -1; });
    
    // tblLoc = tblLoc.map( obj1 => {
    //     const x = assetAmountData.find(obj2 => { return obj1.zipCode === obj2.zipCode; });
    //     (typeof x !== 'undefined') ? obj1.amount = +x.amount : obj1.amount = 0;
    //     return obj1;
    // });
    
        
    if(!jQuery.isEmptyObject(filter)){
        try {
            sessionStorage.setItem("tblAssetFilter", JSON.stringify(tblAst));
        }
        catch(err) {
            console.log(err)
        } 
    }

    treeTemplate = transformData(tblLoc);
    renderParentTree(treeTemplate);
    for (let i = 0; i < assetClass.length ; i++){
        renderAssetHTML(assetClass[i], tblAst.filter((obj) => obj.colAssetClass == assetClass[i]))
    }
}
