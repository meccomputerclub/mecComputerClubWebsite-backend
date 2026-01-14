/**
 * @swagger
 * tags:
 *   - name: Forms
 *     description: Event form management
 *   - name: Form Submissions
 *     description: User form submissions
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FormField:
 *       type: object
 *       properties:
 *         label:
 *           type: string
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           example: text
 *         required:
 *           type: boolean
 *         options:
 *           type: array
 *           items:
 *             type: string
 *
 *     Form:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         eventId:
 *           type: string
 *         fields:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/FormField"
 *         isActive:
 *           type: boolean
 *
 *     FormSubmission:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         formId:
 *           type: string
 *         userId:
 *           type: string
 *         responses:
 *           type: object
 *
 *     PaginatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         count:
 *           type: number
 *         total:
 *           type: number
 *         links:
 *           type: object
 *           properties:
 *             self:
 *               type: string
 *             next:
 *               type: string
 *             prev:
 *               type: string
 *         data:
 *           type: array
 */

/**
 * @swagger
 * /forms:
 *   post:
 *     summary: Create a new form (Admin)
 *     tags: [Forms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, eventId, fields]
 *             properties:
 *               title:
 *                 type: string
 *               eventId:
 *                 type: string
 *               fields:
 *                 type: array
 *                 items:
 *                   $ref: "#/components/schemas/FormField"
 *     responses:
 *       201:
 *         description: Form created successfully
 */

/**
 * @swagger
 * /forms/event/{eventId}:
 *   get:
 *     summary: Get forms by event (filter, sort, paginate)
 *     tags: [Forms]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: createdAt:desc
 *
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *
 *     responses:
 *       200:
 *         description: Paginated list of forms
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/PaginatedResponse"
 */

/**
 * @swagger
 * /forms/{id}:
 *   get:
 *     summary: Get a single form by ID
 *     tags: [Forms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Form details
 */

/**
 * @swagger
 * /forms/{id}/disable:
 *   patch:
 *     summary: Disable a form (Admin)
 *     tags: [Forms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Form disabled successfully
 */

/**
 * @swagger
 * /forms/{formId}/submit:
 *   post:
 *     summary: Submit a form
 *     tags: [Form Submissions]
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [responses]
 *             properties:
 *               responses:
 *                 type: object
 *                 additionalProperties: true
 *     responses:
 *       201:
 *         description: Form submitted successfully
 */

/**
 * @swagger
 * /forms/{formId}/submissions:
 *   get:
 *     summary: Get submissions of a form (Admin)
 *     tags: [Form Submissions]
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: createdAt:desc
 *
 *     responses:
 *       200:
 *         description: Paginated list of submissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/PaginatedResponse"
 */
