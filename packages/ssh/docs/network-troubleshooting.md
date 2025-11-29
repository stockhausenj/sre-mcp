# Network Troubleshooting Cheat Sheet

A comprehensive reference for diagnosing network connectivity issues on Linux systems.

---

## 1. Basic Network Configuration

### View IP addresses and interfaces
```bash
ip addr show
ip addr show <interface>        # e.g., ip addr show wlan0
```

### View routing table
```bash
ip route show
```

### Check which route will be used for a destination
```bash
ip route get <destination_ip>   # e.g., ip route get 10.0.4.209
```

### View network interface status
```bash
ip link show
ip link show <interface>
```

### Show ARP (address resolution protocol) entries
```bash
ip neigh show
```

---

## 2. Testing Connectivity

### Basic ping test
```bash
ping <destination>
ping -c 4 <destination>         # Send only 4 packets
```

### Ping using specific interface
```bash
ping -I <interface> <destination>
ping -I wlan0 10.0.4.1
```

### Ping using specific source IP
```bash
ping -I <source_ip> <destination>
ping -I 10.0.4.152 10.0.4.1
```

### Test specific port connectivity
```bash
nc <host> <port>                # Interactive netcat
nc -zv <host> <port>            # Just test if port is open
nc -s <source_ip> <host> <port> # Use specific source IP

# Alternative: bash TCP test
timeout 5 bash -c 'cat < /dev/tcp/<host>/<port>' && echo "Port is open" || echo "Port is closed"
```

### Check what ports are in use
```bash
lsof -i -P -n | grep LISTEN
```

### Test UDP packets listeners
```bash
echo "Hello" > /dev/udp/127.0.0.1/5005
```

---

## 3. Packet Analysis

### Capture packets on an interface
```bash
sudo tcpdump -i <interface>
sudo tcpdump -i wlan0 -n        # -n = don't resolve hostnames
```

### Capture packets for specific host
```bash
sudo tcpdump -i <interface> -n host <ip>
sudo tcpdump -i wlan0 -n host 10.0.4.1
```

### Capture packets for specific port
```bash
sudo tcpdump -i <interface> -n port <port>
sudo tcpdump -i any -n port 6053
```

### Run tcpdump in background while testing
```bash
sudo tcpdump -i wlan0 -n host 10.0.4.1 &
sleep 1
ping -I wlan0 -c 3 10.0.4.1
sleep 2
sudo pkill tcpdump
```

### Additional tcpdump resources
[Helpful tcpdump examples](https://hackertarget.com/tcpdump-examples/)

---

## 4. WiFi Diagnostics

### Check WiFi connection status (older tool)
```bash
iwconfig <interface>
```

### Check WiFi connection status (newer tool)
```bash
iw dev <interface> link
iw dev wlan0 link
```

### View WiFi/network logs
```bash
dmesg | tail -50 | grep -i wlan
journalctl -u wpa_supplicant -n 50
journalctl -u NetworkManager -n 50
```

---

## 5. Firewall / iptables

### List all iptables rules
```bash
sudo iptables -L -n -v          # Verbose with packet counts
sudo iptables -L <chain> -n -v  # Specific chain
sudo iptables -S                # Show rules in command format
```

### List by specification
```bash
iptables -S
```

### Check specific chains
```bash
sudo iptables -L INPUT -v -n
sudo iptables -L OUTPUT -v -n
sudo iptables -L FORWARD -v -n
```

### Check NAT and MANGLE tables
```bash
sudo iptables -t nat -L -n -v
sudo iptables -t nat -L -v -n --line-numbers  # With line numbers
sudo iptables -t mangle -L -n -v
```

### Check Docker-related chains
```bash
sudo iptables -L DOCKER-USER -v -n
sudo iptables -L DOCKER -v -n
```

### Save/export all iptables rules
```bash
sudo iptables-save              # View all rules
sudo iptables-save > backup.rules  # Save to file
```

### Delete firewall rule by rule number
```bash
iptables -L --line-numbers
iptables -D <CHAIN>(e.g INPUT) <LINE NUM>
```

### Temporarily flush iptables (for testing)
```bash
sudo iptables -P INPUT ACCEPT
sudo iptables -P FORWARD ACCEPT
sudo iptables -P OUTPUT ACCEPT
sudo iptables -F
sudo iptables -t nat -F
sudo iptables -t mangle -F
```

---

## 6. ARP (Address Resolution Protocol)

### View ARP cache
```bash
ip neigh show
ip neigh show dev <interface>   # e.g., ip neigh show dev wlan0
```

### Clear ARP cache for specific IP
```bash
sudo ip neigh del <ip> dev <interface>
```

---

## 7. Advanced Routing

### View routing policy rules
```bash
ip rule show
```

### Add policy-based routing rule
```bash
# Force traffic from specific source IP to use specific routing table
sudo ip rule add from <source_ip> table <table_number>
sudo ip route add default via <gateway> dev <interface> table <table_number>
```

### Example: Fix source IP selection for dual-homed host
```bash
sudo ip rule add from 10.0.4.152 table 100
sudo ip route add default via 10.0.4.1 dev wlan0 table 100
sudo ip route add 10.0.4.0/22 dev wlan0 src 10.0.4.152 table 100
```

---

## 8. Kernel Network Settings

### Check reverse path filtering
```bash
sysctl net.ipv4.conf.all.rp_filter
sysctl net.ipv4.conf.<interface>.rp_filter
```

### Check IP forwarding
```bash
sysctl net.ipv4.ip_forward
```

### View all network-related kernel parameters
```bash
sysctl -a | grep net.ipv4
```

---

## 9. Interface Management

### Bring interface down/up
```bash
sudo ip link set <interface> down
sudo ip link set <interface> up
```

### Restart networking service
```bash
sudo systemctl restart networking          # Debian/Ubuntu
sudo systemctl restart NetworkManager      # Systems using NetworkManager
```

### Reload WiFi driver
```bash
lsmod | grep -i 80211                     # Find wireless module
sudo modprobe -r <module_name>            # Remove module
sudo modprobe <module_name>               # Load module
```

---

## 10. DNS Troubleshooting

### Test query
```bash
resolvectl query example.com
```

### Check status of individual interface
```bash
resolvectl status <interface>
```

### Flush DNS cache
```bash
resolvectl flush-caches
```

### Check DNSSEC (DNS Security Extension)
```bash
dig +dnssec example.com
resolvectl query --dnssec example.com
```

### Clean dig output
```bash
# only return value
dig google.com +short
# only return answer
dig google.com +noall +answer
```

### Query specific DNS resolver
```bash
dig google.com @1.1.1.1
```

---

## 11. SSL/TLS Diagnostics

### Get remote certificate details with curl
```bash
curl --insecure -vvI https://site.domain.com 2>&1 | awk 'BEGIN { cert=0 } /^\* SSL connection/ { cert=1 } /^\*/ { if (cert) print }'
```

### Get server certificate with openssl
```bash
openssl s_client -showcerts -connect site.domain.com:443 </dev/null 2>/dev/null | openssl x509 -text -noout
```

### Get server certificate, certificate chain and other SSL/TLS details
```bash
openssl s_client -showcerts -connect site.domain.com:443 </dev/null 2>/dev/null
```

### Get certificate chain and other SSL/TLS details
```bash
openssl s_client -connect site.domain.com:443 </dev/null 2>/dev/null
```

### Read x509 certificate
```bash
openssl x509 -in site.cer -text
```

---

## 12. SSH Troubleshooting

### Deploy SSH key
```bash
ssh-copy-id -i ~/.ssh/some_key.pub person@yourserver.com
ssh person@yourserver.com 'chcon -t ssh_home_t ~/.ssh/authorized_keys'
```

### Forward SSH agent
```bash
ssh -A server
```

### Skipping known hosts check
```bash
ssh -o StrictHostKeyChecking=no user@host.com
```

---

## 13. Netstat

### Connection count by state
```bash
netstat -ant | awk '{print $6}' | sort | uniq -c | sort -n
```

### See what process is listening on a port
```bash
netstat -tlnp
```

---

## 14. Netcat

### Port scan
```bash
netcat -z -v domain.com 1-1000
```

### Test TCP connection
```bash
netcat -v domain.com 80
```

### Test UDP connection
```bash
netcat -u domain.com 53
```

### Send HTTP body
```bash
printf 'HEAD / HTTP/1.1\r\nHost: neverssl.com\r\nConnection: close\r\n\r\n' | nc neverssl.com 80
```

### Client/Server netcat communication
```bash
server> netcat -l 4444
client> netcat domain.com 4444
```

---

## 15. Network Scanning

### Scan local network for hosts
```bash
sudo nmap -sn 192.168.0.1/24
```

---

## 16. Network Device Information

### Show FDB (forwarding database) table
```bash
bridge fdb show eth0
```

---

## 17. Common Troubleshooting Workflow

### Step 1: Check interface configuration
```bash
ip addr show
ip link show
```

### Step 2: Check routing
```bash
ip route show
ip route get <destination>
```

### Step 3: Test basic connectivity
```bash
ping -I <interface> <gateway>
```

### Step 4: Capture packets to see what's happening
```bash
sudo tcpdump -i <interface> -n host <destination> &
ping -I <interface> -c 3 <destination>
sudo pkill tcpdump
```

### Step 5: Check firewall
```bash
sudo iptables -L -n -v
sudo iptables -t nat -L -n -v
```

### Step 6: Check logs
```bash
dmesg | tail -50
journalctl -xe
```

---

## Common Issues & Solutions

### Issue: Wrong source IP being used
**Symptom:** Packets go out with source IP from wrong interface
**Check:** `sudo tcpdump -i <interface> -n` shows wrong source IP
**Fix:** Use policy-based routing or ping with explicit source: `ping -I <source_ip> <dest>`

### Issue: Interface up but can't communicate
**Symptom:** Interface shows UP but ping fails
**Check:** `ip link show` shows UP, but `ip route get <dest>` shows wrong route
**Fix:** Check routing table and firewall rules

### Issue: Docker interfering with network
**Symptom:** iptables FORWARD chain has DROP policy
**Check:** `sudo iptables -L FORWARD -n -v`
**Fix:** Check DOCKER-USER chain, may need to add ACCEPT rules

### Issue: ARP not resolving
**Symptom:** tcpdump shows ARP requests but no replies
**Check:** Source IP might be on wrong subnet
**Fix:** Ensure source IP matches the network you're trying to reach

---

## Quick Diagnostics One-Liners

```bash
# Complete network overview
ip -br addr && echo "---" && ip route show

# Test if specific port is open
timeout 2 bash -c "</dev/tcp/<host>/<port>" && echo "Open" || echo "Closed"

# Show all active connections
ss -tunap

# Find which process is using a port
sudo lsof -i :<port>
sudo ss -tulpn | grep :<port>

# Show network statistics
ip -s link
netstat -i

# Monitor real-time packet counts on interface
watch -n 1 'ip -s link show <interface>'
```

---

## Tips

- Always use `-n` with tcpdump to avoid DNS lookups (faster and clearer output)
- Use `ip` commands instead of deprecated `ifconfig` and `route` commands
- When testing, work from Layer 1 (physical) up to Layer 7 (application)
- Check logs (`dmesg`, `journalctl`) for hardware or driver issues
- Use tcpdump to see what's actually happening on the wire
- Remember: routing happens before firewall for outbound traffic
