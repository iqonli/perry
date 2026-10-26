# Photo2Fresh 1.2.0 — 2026-10-26

本次基于“三种肉六工况_ONNX部署包_20261026”完成 Android 接入。旧 Matrix 工作流已移除，支持猪/牛/鸡 × 25℃/4℃，输出 TVB-N、新鲜度、已储存时长。25℃固定小时，4℃固定天。

## 源码

[Photo2Fresh-1.2.0-source-20261026.zip](./Photo2Fresh-1.2.0-source-20261026.zip)

源码不含模型、SDK、签名密钥或密码。模型放置和本地构建见压缩包内 README.md；执行验证记录见 VALIDATION.md。

SHA-256：`2e75348233b1d8fbdac426086ccc8108716beadab2a21b0303189b8f430fb93c`

## 完整 APK

两个安装包均已构建并单独备份，请通过原交付会话下载。这里不公开私有备份的文件标识或访问链接。

- arm64-v8a：184120151 字节；SHA-256 `5683c0e2bc8cd00b83694d83ca6efac7f78eaa4b6c106023f262865fe49e7efd`
- x86_64：221967186 字节；SHA-256 `a19d589f0a9ab9d528b4e8c674cd1f9b4a156dd3217ae30358c2f9acd17d5cd2`

两个完整 APK 都超过 GitHub 普通仓库文件 100 MiB 上限，因此 APK 二进制没有提交到本仓库根目录。当前交付渠道未提供可用的 Release 附件或 Git LFS 上传接口，也没有拆掉模型、量化或生成无法直接安装的占位 APK。

APK 使用 Debug 测试证书，可能不能覆盖安装原有版本。各自内置九个完整 ONNX，无需额外模型包。

## 验证

真实 Gradle 构建成功：assembleDebug、testDebugUnitTest、assembleDebugAndroidTest。5 个单元测试通过；9 个模型加载、部署包两组张量哈希及12次合成预测对照通过。两个 APK 的签名、16KiB ZIP 对齐、ABI、模型文件哈希通过。

未连接设备：没有声称通过真机安装、相机全流程、手机性能或独立肉样外部验证。
