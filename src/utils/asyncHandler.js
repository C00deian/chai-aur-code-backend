function asyncHandler(requestHandler) {
    return function (req, res, next) {
        Promise.resolve(requestHandler(req, res, next))
            .catch(function (err) {
                next(err);
            });
    };
}

export { asyncHandler };




// const asyncHandler  = (fun) => () => { }
// const asyncHandler  = (fun) => async() => { }


// heigher order function

// const asyncHandler = (fun) => async (req, res, next) => { 
//     try {

//         await fun(req, res, next);

//     } catch (error) {
//         res.status(err.code || 500).json({
//             success:false,
//             message:err.message
//         })
//     }}



 



