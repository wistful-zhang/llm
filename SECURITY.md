# 安全说明

## 不要提交秘密

这是一个静态网站项目。任何提交到公共仓库或发布到 GitHub Pages 的内容都可能被互联网用户读取。不要在题目、配置、Issue、Pull Request 或 Actions 日志中填写：

- GitHub 密码、Personal Access Token 或 OAuth 凭据
- API Key、数据库连接信息或云服务密钥
- 个人身份信息、公司机密或受保密协议约束的资料

Pages CMS 应通过 GitHub App 授权，并选择 **Only select repositories**，只授予实际使用的题库仓库。

## 报告安全问题

如果发现可能导致凭据泄露、越权写入或供应链风险的问题，请优先使用仓库 Security 页面中的私密漏洞报告功能，不要先创建公开 Issue。若该功能不可用，请通过仓库维护者的 GitHub 个人资料中提供的私密联系方式报告。

普通内容错误、构建失败和样式问题可以使用公开 Issue。

