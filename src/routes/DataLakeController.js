const express = require('express');
const router = express.Router();

const AthenaService = require('../components/AthenaService');
const athenaService = new AthenaService();

/**
 * @openapi
 * /queries:
 *   get:
 *     description: List of prepared statements
 *     responses:
 *       '200':
 *         description: Returns list of datalake.
 *         content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                 type: object
 *                 properties:
 *                      StatementName:
 *                        type: string
 *                      LastModifiedTime:
 *                        type: string
 */
router.get('/', async function(req, res, next) {
  const result = await athenaService.listQueries();
  res.send(result);
});

/**
 * @openapi
 * /queries/{queryName}:
 *   put:
 *     requestBody:
 *      required: true
 *      content:
 *        text/plain:
 *          schema:
 *            type: string
 *     parameters:
 *        - in: path
 *          name: queryName   # Note the name is the same as in the path
 *          required: true
 *          type: string
 *          description: DataLake Athena Query Name.
 *
 *     description: Create or update a query
 *     consumes:
 *        text/plain
 *     responses:
 *       200:
 *         description: returns query created.
 *         content:
 *            application/json
 */
router.put('/:queryName', async function(req, res, next) {
  const result = await athenaService.createQuery({name: req.params.queryName, query: req.body});
  res.send(result);
});

/**
 * @openapi
 * /queries/{queryName}:
 *    get:
 *      description: Get Prepared DataLake Athena Query by name
 *      parameters:
 *          - in: path
 *            name: queryName   # Note the name is the same as in the path
 *            required: true
 *            type: string
 *            description: DataLake Athena Query Name.
 *      responses:
 *       '200':
 *         description: returns query name with id.
 *         content:
 *            application/json:
 *             schema:
 *                type: object
 *                properties:
 *                  StatementName:
 *                    type: string
 *                  QueryStatement:
 *                    type: string
 *                  WorkGroupName:
 *                    type: string
 *                  LastModifiedTime:
 *                    type: string
 */
router.get('/:queryName', async function(req, res, next) {
  const result = await athenaService.getQuery(req.params.queryName);
  res.send(result);
});
module.exports = router;
