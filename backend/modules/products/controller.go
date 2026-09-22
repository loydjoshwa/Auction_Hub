package products

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

const maxFileSize = 5 * 1024 * 1024 // 5 MB

type Controller struct {
	Service *Service
}

func NewController(service *Service) *Controller {
	return &Controller{
		Service: service,
	}
}

func getUserIDFromContext(ctx *gin.Context) (uint, bool) {
	val, exists := ctx.Get("user_id")
	if !exists {
		return 0, false
	}

	switch v := val.(type) {
	case float64:
		return uint(v), true
	case uint:
		return v, true
	case int:
		return uint(v), true
	default:
		return 0, false
	}
}

func isValidImageType(headerContentType string, filename string) bool {
	ct := strings.ToLower(headerContentType)
	ext := strings.ToLower(filepath.Ext(filename))

	validMimes := map[string]bool{
		"image/jpeg": true,
		"image/jpg":  true,
		"image/png":  true,
		"image/webp": true,
	}

	validExts := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".webp": true,
	}

	return validMimes[ct] || validExts[ext]
}

// GET /api/products/my
func (c *Controller) GetMyProducts(ctx *gin.Context) {
	userID, ok := getUserIDFromContext(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated",
		})
		return
	}

	productList, err := c.Service.GetMyProducts(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to fetch products",
		})
		return
	}

	if productList == nil {
		productList = []Product{}
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message":  "Products fetched successfully",
		"products": productList,
	})
}

// POST /api/products
func (c *Controller) CreateProduct(ctx *gin.Context) {
	userID, ok := getUserIDFromContext(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated",
		})
		return
	}

	name := strings.TrimSpace(ctx.PostForm("name"))
	description := strings.TrimSpace(ctx.PostForm("description"))

	if name == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Product name is required and cannot be empty",
		})
		return
	}

	if description == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Product description is required and cannot be empty",
		})
		return
	}

	file, err := ctx.FormFile("image")
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Product image is required",
		})
		return
	}

	if file.Size > maxFileSize {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Image file size must not exceed 5MB",
		})
		return
	}

	mimeType := file.Header.Get("Content-Type")
	if !isValidImageType(mimeType, file.Filename) {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid file format. Only JPG, JPEG, PNG, and WEBP images are allowed.",
		})
		return
	}

	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to prepare upload directory",
		})
		return
	}

	ext := filepath.Ext(file.Filename)
	uniqueFilename := fmt.Sprintf("prod_%d_%d%s", userID, time.Now().UnixNano(), ext)
	savePath := filepath.Join(uploadDir, uniqueFilename)

	if err := ctx.SaveUploadedFile(file, savePath); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to save uploaded image",
		})
		return
	}

	imageURL := fmt.Sprintf("/uploads/%s", uniqueFilename)

	product, err := c.Service.CreateProduct(userID, name, description, imageURL)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "Product created successfully",
		"product": product,
	})
}

// GET /api/products/:id
func (c *Controller) GetProductByID(ctx *gin.Context) {
	userID, ok := getUserIDFromContext(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated",
		})
		return
	}

	idParam := ctx.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid product ID",
		})
		return
	}

	product, err := c.Service.GetProductByID(uint(id), userID)
	if err != nil {
		if err == ErrUnauthorizedAccess {
			ctx.JSON(http.StatusForbidden, gin.H{
				"message": "Forbidden: You do not own this product",
			})
			return
		}
		if err == ErrProductNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{
				"message": "Product not found",
			})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to fetch product",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Product fetched successfully",
		"product": product,
	})
}

// PUT /api/products/:id
func (c *Controller) UpdateProduct(ctx *gin.Context) {
	userID, ok := getUserIDFromContext(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated",
		})
		return
	}

	idParam := ctx.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid product ID",
		})
		return
	}

	name := strings.TrimSpace(ctx.PostForm("name"))
	description := strings.TrimSpace(ctx.PostForm("description"))

	if name == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Product name is required and cannot be empty",
		})
		return
	}

	if description == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Product description is required and cannot be empty",
		})
		return
	}

	var newImageURL string
	file, err := ctx.FormFile("image")
	if err == nil {
		// New image file was uploaded
		if file.Size > maxFileSize {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"message": "Image file size must not exceed 5MB",
			})
			return
		}

		mimeType := file.Header.Get("Content-Type")
		if !isValidImageType(mimeType, file.Filename) {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"message": "Invalid file format. Only JPG, JPEG, PNG, and WEBP images are allowed.",
			})
			return
		}

		uploadDir := "./uploads"
		if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to prepare upload directory",
			})
			return
		}

		ext := filepath.Ext(file.Filename)
		uniqueFilename := fmt.Sprintf("prod_%d_%d%s", userID, time.Now().UnixNano(), ext)
		savePath := filepath.Join(uploadDir, uniqueFilename)

		if err := ctx.SaveUploadedFile(file, savePath); err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to save uploaded image",
			})
			return
		}

		newImageURL = fmt.Sprintf("/uploads/%s", uniqueFilename)
	}

	product, err := c.Service.UpdateProduct(uint(id), userID, name, description, newImageURL)
	if err != nil {
		if err == ErrUnauthorizedAccess {
			ctx.JSON(http.StatusForbidden, gin.H{
				"message": "Forbidden: You do not own this product",
			})
			return
		}
		if err == ErrProductNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{
				"message": "Product not found",
			})
			return
		}
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Product updated successfully",
		"product": product,
	})
}

// DELETE /api/products/:id
func (c *Controller) DeleteProduct(ctx *gin.Context) {
	userID, ok := getUserIDFromContext(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"message": "User not authenticated",
		})
		return
	}

	idParam := ctx.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid product ID",
		})
		return
	}

	product, err := c.Service.DeleteProduct(uint(id), userID)
	if err != nil {
		if err == ErrUnauthorizedAccess {
			ctx.JSON(http.StatusForbidden, gin.H{
				"message": "Forbidden: You do not own this product",
			})
			return
		}
		if err == ErrProductNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{
				"message": "Product not found",
			})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to delete product",
		})
		return
	}

	// Clean up stored file if it exists locally
	if strings.HasPrefix(product.ImageURL, "/uploads/") {
		filename := strings.TrimPrefix(product.ImageURL, "/uploads/")
		filePath := filepath.Join("./uploads", filename)
		_ = os.Remove(filePath)
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Product deleted successfully",
	})
}
