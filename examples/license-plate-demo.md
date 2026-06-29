# Demo：八字车牌推荐

命令：

```bash
python scripts/license_plate_recommend.py \
  --birth-date 1990-05-12 \
  --birth-time 08:30 \
  --gender female \
  --plates 粤B8A68Z 粤B52088 粤B3M96Q
```

输出会包含：

- 最终推荐排序
- 每个车牌的综合分和推荐等级
- 五个分项得分
- 八字五行偏好、数字五行、字母五行、易记性和谐音避雷解释
- 娱乐参考免责声明
