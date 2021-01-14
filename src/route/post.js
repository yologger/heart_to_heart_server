const express = require('express')
const router = express.Router()
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const { verifyAccessToken } = require('../middleware')
const { User, PostImage, Post, Love } = require('../../models')


fs.readdir('uploads', (error) => {
    if (error) {
        fs.mkdirSync('uploads')
    }
})

const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, callback) {
            callback(null, 'uploads/')
        },
        filename(req, file, callback) {
            const ext = path.extname(file.originalname)
            callback(null, path.basename(file.originalname, ext) + '_' + new Date().valueOf() + ext)
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 }   // 5MB
})

// router.post('/img', upload.single('field'), (req, res) => {
//     res.status(200).json({
//         code: 1,
//         message: "Single image successfully uploaded.",
//         data: {
//             image: req.file.path
//         }
//     })
// })

// router.post('/imgs', upload.array('field'), (req, res) => {
//     let images = []

//     for (var idx in req.files) {
//         images.push(req.files[idx].path)
//     }

//     res.status(200).json({
//         code: 1,
//         message: "Multiple images successfully uploaded.",
//         data: {
//             images: images
//         }
//     })
// })

router.get('/posts', async (req, res, next) => {

    const page = req.query["page"]
    const size = req.query["size"]

    if (!page) {
        res.status(400).json({
            code: -2,
            error_message: "page does not exists."
        })
    } else {
        if (!size) {
            res.status(400).json({
                code: -2,
                error_message: "size does not exists."
            })
        } else {
            const offset = page * size
            const limit = size
            try {
                let posts = await Post.findAll({
                    offset: +offset,
                    limit: +limit,
                    order: [['createdAt', 'DESC']],
                    attributes: ["id", "content", "createdAt", "userId"],
                    include: [{
                        model: User,
                        attributes: ["nickname", "email", "url"]
                    }, {
                        model: PostImage,
                        attributes: ["id", "url"]
                    }]
                })

                res.status(200).json({
                    code: 1,
                    message: "success",
                    count: posts.length,
                    data: {
                        posts: posts
                    }
                })
            } catch (error) {
                console.error(error)
                next(error)
            }
        }
    }
})

router.post('/post', upload.array('field'), async (req, res, next) => {

    try {
        let user = await User.findOne({
            where: { id: req.body["user_id"] }
        })

        if (!user) {
            // User does not exist.
            return res.status(400).json({
                "code": -1,
                "error_message": "User does not exist."
            });
        }

        let post = await user.createPost({
            user_id: req.body["user_id"],
            content: req.body["content"]
        })

        let images = []
        for (var idx in req.files) {
            images.push({
                url: req.files[idx].path
            })
        }

        let postImages = await PostImage.bulkCreate(images)
        let createdpost = await post.addPostImages(postImages)

        let createdPostId = createdpost.dataValues.id
        let _createdPost = await Post.findOne({ 
            where: { id: createdPostId },
            attributes: ["id", "content", "createdAt", "userId"],
            include: [{
                model: User,
                attributes: ["nickname", "email", "url"]
            }, {
                model: PostImage,
                attributes: ["id", "url"]
            }]
        })

        res.status(200).json({
            code: 1,
            message: "Post successfully created.",
            data: {
                post: _createdPost
            }
        })

    } catch (error) {
        console.error(error)
        next(error)
    }
})

router.get('/test', verifyAccessToken, (req, res) => {
    res.status(202).json({
        "code": 1,
        "message": 'Success',
        "data": {
            "name": "ronaldo"
            // "posts": [{
            //     "author": "Kane",
            //     "content": "Hello World"
            // }, {
            //     "author": "Ronaldo",
            //     "content": "read madrid is good"
            // }]
        }
    })
})

router.post("/:post/love", async (req, res) => {
    const postId = req.params["post"]
    const userId = req.body["user"]

    const post = await Post.findOne({ where: { id: postId } })

    // await me.addFollowing(parseInt(following, 10))
    const user = await Love.create({ userId: userId })
    await post.addLove(user)

    res.json({
        "data": "qew"
    })
})

module.exports = router