'use strict';
var express = require('express'); // Web Framework
var app = express();
var sql = require('mssql'); // MS Sql Server client
var path = require('path');
var fs = require('fs');


// Connection string parameters.
var config = {
    user: 'sjlmsibdb',
    password: 'j8c8?kSJ^zR8gGK',
    server: 'testing-sjlmsib.database.windows.net',
    database: 'IBDB',
    options: {
        encrypt: true,
    }
}

app.use(express.static(__dirname));

app.get('/', function (req, res) {
  res.sendFile('index.html',{root: path.join(__dirname)})
})

app.get('/api/tblLoc', function (req, res) {

  // connect to your database
  var start = new Date();

  setTimeout(function (argument) {
      // execution time simulated with setTimeout function
  new sql.ConnectionPool(config).connect().then(pool => {
    return pool.request().query(`
      select colBlk as block, colEstate as est, colPrefix as pre, colPropertyManager as pm, 
      colPropertyOfficer as po, colSt as st, colTc as tc, colTcCode as tcCode, colWard as ward, colZipCode as zipCode 
      from tblLoc order by colTc, colWard, colPropertyManager`)
    }).then(result => {
      let rows = result.recordset
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.status(200).json(rows);
      sql.close();
    }).catch(err => {
      res.status(500).send({ message: "${err}"})
      sql.close();
    });
      var end = new Date() - start;
      console.info("Execution time: %dms", end);
  }, 1000);
});

app.get('/api/tblAsset', function (req, res) {

  // connect to your database
  var start = new Date();

  setTimeout(function (argument) {
      // execution time simulated with setTimeout function
    new sql.ConnectionPool(config).connect().then(pool => {
      return pool.request().query(`
        SELECT 
          ta.colAssetID,
          MIN(colZipCode) AS colZipCode,
          MIN(colAssetClass) AS colAssetClass,
          MIN(CONCAT(tla.colAlarmId,tlma.colAlarmId)) AS hasAlarm,
          MIN(CONCAT(tlf.[colFaultId],tlmf.[colFaultId])) AS hasFault,
          MIN(CONCAT(tla.colAlarmCode,tlma.colAlarmCode)) AS colAlarmCode,
          MIN(CONCAT(tlmdm.colManufacturerCompanyId,tld.colManufacturerCompanyId,tp.colManufacturerCompanyId)) AS companyID,
          MIN(ta.colSt) AS st
        FROM [dbo].[tblAsset] AS ta
          LEFT JOIN tblLiftDetail AS tld ON ta.colAssetID = tld.colAssetID
          LEFT JOIN tblLMDDetail AS tlmd ON ta.colAssetID = tlmd.colAssetID
          LEFT JOIN tblPumpDetail AS tp ON ta.colAssetID = tp.colAssetID
          LEFT JOIN tblLMDModel AS tlmdm ON tlmd.colLMDModelID = tlmdm.colLMDModelID
          LEFT JOIN tblLiftAlarm AS tla ON tld.colAssetID = tla.colLiftId
          LEFT JOIN tblLiftAlarm AS tlma ON tlmd.colAssetID = tlma.colLmdId
          LEFT JOIN tblLiftFault AS tlf ON tld.colAssetID = tlf.colLiftId
          LEFT JOIN tblLiftFault AS tlmf ON tlmd.colAssetID = tlmf.colLmdId
          LEFT JOIN tblWaterPumpFault AS tlpf ON tld.colAssetID = tlpf.colLiftId
          LEFT JOIN tblWaterPumpFault AS tlmpf ON tlmd.colAssetID = tlmpf.colLmdId
          
      GROUP BY ta.colAssetID
      `)
      }).then(result => {
        let rows = result.recordset
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.status(200).json(rows);
        sql.close();
      }).catch(err => {
        res.status(500).send({ message: "${err}"})
        sql.close();
      });
      var end = new Date() - start;
      console.info("Execution time: %dms", end);
  }, 1000);
});

app.get('/api/assetCount', function (req, res) {

  // connect to your database
  var start = new Date();

  setTimeout(function (argument) {
      // execution time simulated with setTimeout function
    new sql.ConnectionPool(config).connect().then(pool => {
      return pool.request().query(`
        SELECT colZipCode, count(*) as assetAmount
        FROM [dbo].[tblAsset]
        group by colZipCode
      `)
      }).then(result => {
        let rows = result.recordset
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.status(200).json(rows);
        sql.close();
      }).catch(err => {
        res.status(500).send({ message: "${err}"})
        sql.close();
      });
      var end = new Date() - start;
      console.info("Execution time: %dms", end);
  }, 1000);
});

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);