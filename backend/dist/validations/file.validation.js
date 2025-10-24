import Joi from 'joi';
const uploadFile = {
// No body validation needed for file upload as we handle it with multer
// File validation is done in the service layer
};
const getFile = {
    params: Joi.object().keys({
        id: Joi.number().integer().required()
    })
};
const getFiles = {
    query: Joi.object().keys({
        limit: Joi.number().integer().min(1).max(100).default(10),
        page: Joi.number().integer().min(1).default(1),
        sortBy: Joi.string().valid('uploadedAt', 'originalName', 'size', 'contentType').default('uploadedAt'),
        sortType: Joi.string().valid('asc', 'desc').default('desc')
    })
};
const updateFile = {
    params: Joi.object().keys({
        id: Joi.number().integer().required()
    })
    // No body validation needed for file update as we handle it with multer
    // File validation is done in the service layer
};
const deleteFile = {
    params: Joi.object().keys({
        id: Joi.number().integer().required()
    })
};
export default {
    uploadFile,
    getFile,
    getFiles,
    updateFile,
    deleteFile
};
