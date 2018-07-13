function fetchData(url) {
    let json = null;
    $.ajax({
        'async': false,
        'global': false,
        'url': url,
        'dataType': "json",
        'success': function (data) {
            json = data;
        }
    });
    return json;
}

function getTree(tcCodeFilter = '', wardCodeFilter = '', zipCodeFilter = '') {
    // Initialize
    let LocTreePath,assetAmountData,LocTree

    if(typeof(Storage) !== "undefined") {
        if (localStorage.LocTreePath) {
            LocTreePath = JSON.parse(localStorage.LocTreePath);
        } else {
            LocTreePath = fetchData('data/LocTreePath.json');
            localStorage.setItem("LocTreePath", JSON.stringify(LocTreePath));
        }
    }

    if(typeof(Storage) !== "undefined") {
        if (localStorage.assetAmountData) {
            assetAmountData = JSON.parse(localStorage.assetAmountData);
        } else {
            assetAmountData = fetchData('data/AssetAmountForEachZipCode.json');
            localStorage.setItem("assetAmountData", JSON.stringify(assetAmountData));
        }
    }

    if(typeof(Storage) !== "undefined") {
        if (localStorage.LocTree) {
            LocTree = JSON.parse(localStorage.LocTree);
        } else {
            LocTree = fetchData('data/LocTree.json');
            localStorage.setItem("LocTree", JSON.stringify(LocTree));
        }
    }
    // const assetAmountData = fetchData('data/AssetAmountForEachZipCode.json');
    // const LocTree =  fetchData('data/LocTree.json');

    // mapping for Asset Amount for each ZipCode
    // let data = LocTree.map( obj1 => {
    //     const x = assetAmountData.find(obj2 => { return obj1.NodeText === obj2.colZipCode; });
    //     (typeof x !== 'undefined') ? obj1.amount = +x.assetAmount : obj1.amount = 0;
    //     return obj1;
    // });

    treeTemplate = LocTreePath.map( obj1 => {
        const x = assetAmountData.find(obj2 => { return obj1.ZipCode === obj2.colZipCode; });
        (typeof x !== 'undefined') ? obj1.amount = +x.assetAmount : obj1.amount = 0;
        return obj1;
    });

    // Mapping Data to create Treeview
    if (tcCodeFilter !== '') {data = data.filter((obj) => { return obj.TcNodeId === tcCodeFilter; }); }
    if (wardCodeFilter !== '') {data = data.filter((obj) => { return obj.WardNodeId === wardCodeFilter; }); }
    if (zipCodeFilter !== '') {data = data.filter((obj) => { return obj.ZipCode === zipCodeFilter; }); }

    treeTemplate = _(treeTemplate).groupBy(TcLevel => TcLevel.TcNodeId)
        .map((value, key) => ({
            TcNodeId: key,
            TcNodeAmount: _.sumBy(value, 'amount'),
            ZipCodeArr: value.map(ZipCode => ZipCode.ZipCode),
            WardLevel: _(value)
                .groupBy( y => y.WardNodeId)
                .map((value, key) => ({
                    WardNodeID: key,
                    WardNodeAmount: _.sumBy(value, 'amount'),
                    ZipCodeArr: value.map(ZipCode => ZipCode.ZipCode),
                    ZipLevel: _(value)
                        .map((value) => ({
                            ZipCodeArr: [value.ZipCode],
                            amount: value.amount,
                        }))
                        .value()
                }))
                .value()
        }))
        .value();

    renderTcLevel(treeTemplate);
    // getAsset();

}


function getAsset(zipCodeArr){
    // let asset = (function() {
    //     let json = null;
    //     $.ajax({
    //         'async': false,
    //         'global': false,
    //         'url': "data/tblAsset.json",
    //         'dataType': "json",
    //         'success': function (data) {
    //             json = data;
    //         }
    //     });
    //     return json;
    // })();

    // if(typeof(zipCodeArr) !== "undefined") {
    //     zipCodeArr = zipCodeArr.map((x) => x.toString());
    //     const assetList = asset.filter((obj)) => { return zipCodeArr.indexOf(obj.colZipCode) > -1; });
    //     let assetClassArr = asset.map((x)=> => obj.col x.colAssetClass).filter((v, i, a) => a.indexOf(v) === i);
    // }
    // renderAssetList(asset);

    let assetList = [];

    if (localStorage.tblAsset) {
        assetList = localStorage.tblAsset;
    } else {
        assetList = localStorage.setItem("tblAsset", JSON.stringify(fetchData("data/tblAsset.json")));
    }

    if(typeof(zipCodeArr) !== "undefined") {
        
        assetList = JSON.parse(assetList);
        zipCodeArr = zipCodeArr.map((x) => x.toString());
        assetList = assetList.filter((obj) => { return zipCodeArr.indexOf(obj.colZipCode) > -1; });
        renderAssetList(assetList);

    }
    else{
        assetList = JSON.parse(assetList);
        renderAssetList(assetList);
    }
    
}

function renderTreeLoc(data) {
    console.log(data);
    let treeHTML = '';
    let wardLevelTxt = [];
    let zipLevelTxt = [];
    for(i=0; i<data.length ; i++){
        for(j=0; j<data[i].children.length ; j++){
            zipLevelTxt[j] = [];
            for(k=0; k<data[i].children[j].children.length ; k++){
                zipLevelTxt[j][k] = [`
                <li class="list-group-item">
                  <i class="fa fa-chevron-right" aria-hidden="true"></i>
                  <span onclick="getAsset([${data[i].children[j].children[k].NodeText}])">
                    ${data[i].children[j].children[k].NodeText}
                    <span class="badge badge-success">${data[i].children[j].children[k].amount}</span>
                  </span>
                </li>`];
            }
            wardLevelTxt[j] = `
             <li class="list-group-item" >
              <i class="fa fa-chevron-right f" aria-hidden="true"></i>
              <span id="wardLevel${data[i].children[j].NodeID}" onclick="getAsset('${JSON.stringify(data[i].children[j])}')">
                ${ data[i].children[j].NodeText }
                <span class="badge badge-success">${data[i].children[j].amount}</span>
              </span>
              <ul class="list-group sub-menu zipLevel">
                ${zipLevelTxt[j].join(" ")}
              </ul>
            </li>`;
        }
        treeHTML += `
        <li class="list-group-item">
          <i class="fa fa-chevron-right f" aria-hidden="true"></i>
          <span onclick="getAsset([]);">
            ${data[i].NodeText}
            <span class="badge badge-success">${data[i].totalAmount}</span>
          </span>
          <ul class="list-group sub-menu wardLevel">
            ${wardLevelTxt.join(" ")}
          </ul>
        </li>`;
    }
    $('.menu').html(treeHTML);
}
function  renderAssetList(asset) {

    // cari cara supaya dapet unique dari asset!
    let assetClass = ["LMD","Lift","LMPD","HLMD"]

    for (let i = 0; i < assetClass.length -1 ; i++){
        renderAssetHTML(assetClass[i], asset.filter((obj) => obj.colAssetClass == assetClass[i]))
    }
}

function transformToTree(arr){
    let nodes = {};    
    arr.filter(function(obj){
        
        let id = obj["NodeID"],
            parentId = obj["ParentNodeId"];
        nodes[id] = _(obj).defaults( nodes[id],{ zipCodeArr : []}, { children: [] });
        parentId && (nodes[parentId] = (nodes[parentId] || { children: [] }))["zipCodeArr"].push(obj);
        parentId && (nodes[parentId] = (nodes[parentId] || { children: [] }))["children"].push(obj);
        return !parentId;
    });    
    return arr;
}

function getNestedChildren(arr, parent) {
    var out = []
    for(let i in arr) {
        if(arr[i].ParentNodeId == parent) {

            var children = getNestedChildren(arr, arr[i].NodeID)
            if(children.length) {
                arr[i].children = children
            }
            out.push(arr[i])
        }
    }
    return out
}

function renderTcLevel(treeTemplate, parrentNodeID) {
    const locTree = JSON.parse(localStorage.LocTree);

    let data = locTree.filter((obj) => { return obj.ParentNodeId == 0; });
    data = _.merge(data, treeTemplate);
    console.log(treeTemplate);
    console.log(data);

    let treeHTML = '';
        $('.sub-menu:not("#wardLevelID'+parrentNodeID+'")').html('');
        $('.sub-menu:not("#wardLevelID'+parrentNodeID+'")').hide();
    $('.menu').html("");
    for(let i=0; i<=data.length-1 ; i++){
        const id = "tcID"+data[i].NodeID;

        treeHTML = `
        <li class="list-group-item">
          <i class="fa fa-chevron-right f" aria-hidden="true"></i>
          <span id="${id}">
            ${data[i].NodeText}
            <span class="badge badge-success">${data[i].TcNodeAmount}</span>
          </span>
          <ul id='wardLevelID${data[i].NodeID}' class="list-group sub-menu wardLevel">
          </ul>
        </li>`;

        $('.menu').append(treeHTML);

        // Get the button, and when the user clicks on it, execute renderFunction
        document.getElementById(id).onclick = (function(tcData) {
            return function (e) { 
                renderWardLevel(tcData);
                getAsset(tcData.ZipCodeArr);
            };
        })(data[i]);
    }
}

function renderWardLevel(tcData) {
    const locTree = JSON.parse(localStorage.LocTree);
    let wardData = locTree.filter((obj) => { return obj.ParentNodeId ==  tcData.NodeID});
    wardData = _.merge(wardData, tcData.WardLevel);
    let treeHTML = '';

        $('.sub-menu:not("#wardLevelID'+tcData.ParentNodeId+'")').html('');
        $('.sub-menu:not("#wardLevelID'+tcData.ParentNodeId+'")').hide();
        
    for(let i=0; i<=wardData.length-1 ; i++){

        const id = "WardID"+wardData[i].NodeID;

        treeHTML = `
        <li class="list-group-item">
          <i class="fa fa-chevron-right f" aria-hidden="true"></i>
          <span id="${id}">
            ${wardData[i].NodeText}
            <span class="badge badge-success">${wardData[i].WardNodeAmount}</span>
          </span>
          <ul id='ZipLevelID${wardData[i].NodeID}' class="list-group sub-menu wardLevel">
          </ul>
        </li>`;
        $('#wardLevelID'+tcData.NodeID).append(treeHTML);
        $('#wardLevelID'+tcData.NodeID).show();

        document.getElementById(id).onclick = (function(wardData) {
        return function (e) { 
                renderZipLevel(wardData)
                getAsset(wardData.ZipCodeArr);
            };
        })(wardData[i]);
    }    
}
function renderZipLevel(ward) {
    const locTree = JSON.parse(localStorage.LocTree);
    let zipData = locTree.filter((obj) => { return obj.ParentNodeId ==  ward.NodeID});

    zipData = _.merge(zipData, ward.ZipLevel);
    console.log(ward);

    let treeHTML = '';
    $('.sub-menu:not("#wardLevelID'+ward.ParentNodeId+'")').html('');
    $('.sub-menu:not("#wardLevelID'+ward.ParentNodeId+'")').hide();

    for(let i=0; i<=zipData.length-1 ; i++){

        const id = "ZipID"+zipData[i].NodeID;

        treeHTML = `
        <li class="list-group-item">
          <i class="fa fa-chevron-right f" aria-hidden="true"></i>
          <span id="${id}">
            ${zipData[i].NodeText}
            <span class="badge badge-success">${zipData[i].amount}</span>
          </span>
          <ul id='ZipLevelID${zipData[i].NodeID}' class="list-group sub-menu wardLevel">
          </ul>
        </li>`;
        $('#ZipLevelID'+ward.NodeID).append(treeHTML);
        $('#ZipLevelID'+ward.NodeID).show();

        document.getElementById(id).onclick = (function(zipData) {
        return function (e) { 
            console.log("wardsdada",zipData);

                getAsset([zipData.NodeText]);
            };
        })(zipData[i]);
    }    
}



function renderAssetHTML(key,data){
    $("#collapse"+key+" span.totalAsset").html('('+data.length+')');

    $('#collapse'+key+' table').DataTable({
    "pageLength": 100,
    "destroy": true,
    "data": data,
    "bLengthChange": false,
    "searching": false,
    "bInfo": false,  
    "drawCallback": function () {
        $('.dataTables_paginate > .pagination').addClass('pagination-sm');
    },
    "columns": [
        {
            "data": "colAssetID",
            "render": function ( data, type, row, meta ) {
              return `
                <div class="f-group">
                    <input type="checkbox" class="checkbox" name="selectedAssetsHMPD[]" id="hlmd${data}" value="${data}">
                    <label for="hlmd${data}" class="checkbox-label" style="margin-left: -1px;"><a href="${data}">${data}</a></label>
                </div>`;
            }            
        }
    ]
    });
}